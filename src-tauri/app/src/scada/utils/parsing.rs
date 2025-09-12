use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;

use super::super::entities::{
    FallbackMessage, LegacyMessage, ScadaMessage, ScadaOutput, TsTmMessage,
};

// Configuration pour le parsing
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ParsingConfig {
    pub strict_mode: bool,
    pub fallback_on_error: bool,
    pub required_fields: Vec<String>,
    pub field_mappings: HashMap<String, String>,
    pub default_values: HashMap<String, serde_json::Value>,
    pub validation_rules: ValidationRules,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ValidationRules {
    pub min_timestamp: Option<u64>,
    pub max_timestamp: Option<u64>,
    pub allowed_causes: Option<Vec<String>>,
    pub allowed_validities: Option<Vec<String>>,
    pub value_range: Option<(f64, f64)>,
}

impl Default for ParsingConfig {
    fn default() -> Self {
        Self {
            strict_mode: false,
            fallback_on_error: true,
            required_fields: vec!["id".to_string()],
            field_mappings: HashMap::new(),
            default_values: HashMap::new(),
            validation_rules: ValidationRules::default(),
        }
    }
}

impl Default for ValidationRules {
    fn default() -> Self {
        Self {
            min_timestamp: None,
            max_timestamp: None,
            allowed_causes: None,
            allowed_validities: None,
            value_range: None,
        }
    }
}

// Résultat du parsing avec informations détaillées
#[derive(Debug)]
pub enum ParseResult {
    Success(ScadaMessage),
    PartialSuccess(ScadaMessage, Vec<String>), // Message + warnings
    Failed(ParseError),
}

#[derive(Debug, Clone)]
pub struct ParseError {
    pub error_type: ParseErrorType,
    pub message: String,
    pub field: Option<String>,
    pub raw_data: Option<String>,
}

#[derive(Debug, Clone)]
pub enum ParseErrorType {
    InvalidJson,
    MissingRequiredField,
    InvalidFieldType,
    ValidationFailed,
    UnsupportedFormat,
    InvalidUtf8,
}

// Parser principal
pub struct ScadaMessageParser {
    config: ParsingConfig,
}

impl ScadaMessageParser {
    pub fn new(config: ParsingConfig) -> Self {
        Self { config }
    }

    pub fn with_default_config() -> Self {
        Self::new(ParsingConfig::default())
    }

    pub fn parse_message(
        &self,
        scada_output: &Arc<ScadaOutput>,
        payload: &[u8],
        topic: &str,
    ) -> ParseResult {
        // Étape 1: Conversion UTF-8
        let payload_str = match std::str::from_utf8(payload) {
            Ok(s) => s,
            Err(e) => {
                return ParseResult::Failed(ParseError {
                    error_type: ParseErrorType::InvalidUtf8,
                    message: format!("Invalid UTF-8 encoding: {}", e),
                    field: None,
                    raw_data: Some(format!("{:?}", payload)),
                });
            }
        };

        // Étape 2: Parsing JSON
        let json_value = match serde_json::from_str::<serde_json::Value>(payload_str) {
            Ok(v) => v,
            Err(e) => {
                if self.config.fallback_on_error {
                    return ParseResult::Success(self.create_fallback_message(
                        scada_output,
                        payload_str,
                        format!("JSON parsing failed: {}", e),
                    ));
                } else {
                    return ParseResult::Failed(ParseError {
                        error_type: ParseErrorType::InvalidJson,
                        message: format!("JSON parsing failed: {}", e),
                        field: None,
                        raw_data: Some(payload_str.to_string()),
                    });
                }
            }
        };

        // Étape 3: Application des mappings de champs
        let mapped_json = self.apply_field_mappings(&json_value);

        // Étape 4: Détection du format et parsing
        self.parse_json_message(scada_output, &mapped_json, topic)
    }

    fn apply_field_mappings(&self, json: &serde_json::Value) -> serde_json::Value {
        if self.config.field_mappings.is_empty() {
            return json.clone();
        }

        let mut result = json.clone();
        if let serde_json::Value::Object(ref mut obj) = result {
            let mut new_fields = HashMap::new();

            for (from_field, to_field) in &self.config.field_mappings {
                if let Some(value) = obj.remove(from_field) {
                    new_fields.insert(to_field.clone(), value);
                }
            }

            for (key, value) in new_fields {
                obj.insert(key, value);
            }
        }

        result
    }

    fn parse_json_message(
        &self,
        scada_output: &Arc<ScadaOutput>,
        json: &serde_json::Value,
        topic: &str,
    ) -> ParseResult {
        let mut warnings = Vec::new();

        // Validation des champs requis
        if let Err(error) = self.validate_required_fields(json) {
            if self.config.strict_mode {
                return ParseResult::Failed(error);
            } else {
                warnings.push(format!("Missing required field: {:?}", error.field));
            }
        }

        // Détermination du format
        if self.is_ts_tm_format(json) {
            match self.parse_ts_tm_message(scada_output, json) {
                Ok(message) => {
                    if warnings.is_empty() {
                        ParseResult::Success(message)
                    } else {
                        ParseResult::PartialSuccess(message, warnings)
                    }
                }
                Err(error) => {
                    if self.config.fallback_on_error {
                        let payload_str = serde_json::to_string(json).unwrap_or_default();
                        ParseResult::Success(self.create_fallback_message(
                            scada_output,
                            &payload_str,
                            error.message,
                        ))
                    } else {
                        ParseResult::Failed(error)
                    }
                }
            }
        } else {
            match self.parse_legacy_message(scada_output, json) {
                Ok(message) => {
                    if warnings.is_empty() {
                        ParseResult::Success(message)
                    } else {
                        ParseResult::PartialSuccess(message, warnings)
                    }
                }
                Err(error) => {
                    if self.config.fallback_on_error {
                        let payload_str = serde_json::to_string(json).unwrap_or_default();
                        ParseResult::Success(self.create_fallback_message(
                            scada_output,
                            &payload_str,
                            error.message,
                        ))
                    } else {
                        ParseResult::Failed(error)
                    }
                }
            }
        }
    }

    fn is_ts_tm_format(&self, json: &serde_json::Value) -> bool {
        json.get("tase2").and_then(|v| v.as_str()).is_some()
    }

    fn validate_required_fields(&self, json: &serde_json::Value) -> Result<(), ParseError> {
        for field in &self.config.required_fields {
            if json.get(field).is_none() {
                return Err(ParseError {
                    error_type: ParseErrorType::MissingRequiredField,
                    message: format!("Missing required field: {}", field),
                    field: Some(field.clone()),
                    raw_data: None,
                });
            }
        }
        Ok(())
    }

    fn parse_ts_tm_message(
        &self,
        scada_output: &Arc<ScadaOutput>,
        json: &serde_json::Value,
    ) -> Result<ScadaMessage, ParseError> {
        let tase2 = json
            .get("tase2")
            .and_then(|v| v.as_str())
            .ok_or_else(|| ParseError {
                error_type: ParseErrorType::MissingRequiredField,
                message: "Missing tase2 field in TS/TM message".to_string(),
                field: Some("tase2".to_string()),
                raw_data: None,
            })?;

        let timestamp = self.extract_timestamp(json)?;
        let cause = self.extract_with_default(json, "cause", "unknown");
        let validity = self.extract_with_default(json, "validity", "unknown");

        // Validation des règles
        self.validate_cause(&cause)?;
        self.validate_validity(&validity)?;
        self.validate_timestamp(timestamp)?;

        let operator_blocked = json
            .get("operatorBlocked")
            .and_then(|v| v.as_bool())
            .unwrap_or(false);

        let tfos = json
            .get("tfos")
            .and_then(|v| v.as_str())
            .map(|s| s.to_string());

        // Détermination du type et extraction des valeurs
        let (message_type, value, st_val) = self.extract_ts_tm_values(json)?;

        Ok(ScadaMessage::TsTm(TsTmMessage {
            id: scada_output.id.clone(),
            dynawo_id: scada_output.dynawo_id.clone(),
            format: "TS_TM".to_string(),
            tase2: tase2.to_string(),
            graphical_id: scada_output.graphical_id.clone(),
            timestamp,
            cause,
            validity,
            operator_blocked,
            message_type,
            value,
            st_val,
            tfos,
        }))
    }

    fn parse_legacy_message(
        &self,
        scada_output: &Arc<ScadaOutput>,
        json: &serde_json::Value,
    ) -> Result<ScadaMessage, ParseError> {
        Ok(ScadaMessage::Legacy(LegacyMessage {
            id: scada_output.id.clone(),
            dynawo_id: scada_output.dynawo_id.clone(),
            graphical_id: scada_output.graphical_id.clone(),
            format: "Legacy".to_string(),
            value: json.get("value").cloned(),
            time_sent: json.get("time_sent").and_then(|v| v.as_f64()),
            time_received: json.get("time_received").and_then(|v| v.as_f64()),
            raw_message: json.clone(),
        }))
    }

    fn extract_timestamp(&self, json: &serde_json::Value) -> Result<u64, ParseError> {
        let timestamp = json
            .get("ts")
            .and_then(|v| v.as_u64())
            .or_else(|| {
                // Fallback vers les valeurs par défaut
                self.config
                    .default_values
                    .get("ts")
                    .and_then(|v| v.as_u64())
            })
            .unwrap_or(0);

        Ok(timestamp)
    }

    fn extract_with_default(&self, json: &serde_json::Value, field: &str, default: &str) -> String {
        json.get(field)
            .and_then(|v| v.as_str())
            .or_else(|| {
                self.config
                    .default_values
                    .get(field)
                    .and_then(|v| v.as_str())
            })
            .unwrap_or(default)
            .to_string()
    }

    fn extract_ts_tm_values(
        &self,
        json: &serde_json::Value,
    ) -> Result<(String, Option<f64>, Option<serde_json::Value>), ParseError> {
        if let Some(val) = json.get("value").and_then(|v| v.as_f64()) {
            // Validation de la plage de valeurs
            if let Err(e) = self.validate_value_range(val) {
                return Err(e);
            }
            Ok(("TM".to_string(), Some(val), None))
        } else if let Some(st_value) = json.get("stVal") {
            Ok(("TS".to_string(), None, Some(st_value.clone())))
        } else {
            Ok(("TM".to_string(), None, None))
        }
    }

    fn validate_cause(&self, cause: &str) -> Result<(), ParseError> {
        if let Some(allowed_causes) = &self.config.validation_rules.allowed_causes {
            if !allowed_causes.contains(&cause.to_string()) {
                return Err(ParseError {
                    error_type: ParseErrorType::ValidationFailed,
                    message: format!("Invalid cause: {}", cause),
                    field: Some("cause".to_string()),
                    raw_data: None,
                });
            }
        }
        Ok(())
    }

    fn validate_validity(&self, validity: &str) -> Result<(), ParseError> {
        if let Some(allowed_validities) = &self.config.validation_rules.allowed_validities {
            if !allowed_validities.contains(&validity.to_string()) {
                return Err(ParseError {
                    error_type: ParseErrorType::ValidationFailed,
                    message: format!("Invalid validity: {}", validity),
                    field: Some("validity".to_string()),
                    raw_data: None,
                });
            }
        }
        Ok(())
    }

    fn validate_timestamp(&self, timestamp: u64) -> Result<(), ParseError> {
        let rules = &self.config.validation_rules;

        if let Some(min_ts) = rules.min_timestamp {
            if timestamp < min_ts {
                return Err(ParseError {
                    error_type: ParseErrorType::ValidationFailed,
                    message: format!("Timestamp {} is below minimum {}", timestamp, min_ts),
                    field: Some("timestamp".to_string()),
                    raw_data: None,
                });
            }
        }

        if let Some(max_ts) = rules.max_timestamp {
            if timestamp > max_ts {
                return Err(ParseError {
                    error_type: ParseErrorType::ValidationFailed,
                    message: format!("Timestamp {} is above maximum {}", timestamp, max_ts),
                    field: Some("timestamp".to_string()),
                    raw_data: None,
                });
            }
        }

        Ok(())
    }

    fn validate_value_range(&self, value: f64) -> Result<(), ParseError> {
        if let Some((min_val, max_val)) = self.config.validation_rules.value_range {
            if value < min_val || value > max_val {
                return Err(ParseError {
                    error_type: ParseErrorType::ValidationFailed,
                    message: format!(
                        "Value {} is outside allowed range [{}, {}]",
                        value, min_val, max_val
                    ),
                    field: Some("value".to_string()),
                    raw_data: None,
                });
            }
        }
        Ok(())
    }

    fn create_fallback_message(
        &self,
        scada_output: &Arc<ScadaOutput>,
        payload: &str,
        error: String,
    ) -> ScadaMessage {
        ScadaMessage::Fallback(FallbackMessage {
            id: scada_output.id.clone(),
            raw_payload: payload.to_string(),
            parse_error: error,
        })
    }
}

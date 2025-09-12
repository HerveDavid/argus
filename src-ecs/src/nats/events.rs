use bevy::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, Event)]
pub struct NatsEvent {
    pub topic: String,
    pub payload: String,
}

impl NatsEvent {
    pub fn new(topic: impl Into<String>, payload: impl Into<String>) -> Self {
        Self {
            topic: topic.into(),
            payload: payload.into(),
        }
    }

    /// Match ce NatsEvent contre un subject/pattern NATS
    /// Utilise les règles de parsing NATS standard
    ///
    /// # Exemples
    /// ```
    /// let event = NatsEvent::new("HMI.SCADA.equipment1.temperature", "25.5");
    ///
    /// assert!(event.match_topic("HMI.SCADA.>"));              // Multi-level wildcard
    /// assert!(event.match_topic("HMI.*.equipment1.temperature")); // Single-level wildcard
    /// assert!(event.match_topic("HMI.SCADA.equipment1.temperature")); // Exact match
    /// assert!(event.match_topic(">"));                        // Global wildcard
    ///
    /// assert!(!event.match_topic("HMI.GIS.>"));              // Pas de match
    /// assert!(!event.match_topic("HMI.SCADA.equipment2.*"));  // Mauvais équipement
    /// ```
    pub fn match_topic<S>(&self, subject: S) -> bool
    where
        S: AsRef<str>,
    {
        let pattern = subject.as_ref();
        let topic = &self.topic;

        if pattern.is_empty() || topic.is_empty() {
            return false;
        }

        if pattern == ">" {
            return true;
        }

        if pattern.ends_with(".>") {
            let prefix = &pattern[..pattern.len() - 2];
            return topic.starts_with(prefix)
                && (topic.len() == prefix.len() || topic.chars().nth(prefix.len()) == Some('.'));
        }
        if pattern.contains('*') {
            return match_with_single_wildcards(topic, pattern);
        }

        if pattern.contains('>') {
            return false;
        }

        topic == pattern
    }

    pub fn matches_any(&self, patterns: &[&str]) -> bool {
        patterns.iter().any(|pattern| self.match_topic(*pattern))
    }

    pub fn matching_patterns<'a>(&self, patterns: &'a [&str]) -> Vec<&'a str> {
        patterns
            .iter()
            .filter(|pattern| self.match_topic(**pattern))
            .copied()
            .collect()
    }

    pub fn segments(&self) -> Vec<&str> {
        self.topic.split('.').collect()
    }
    pub fn segment(&self, index: usize) -> Option<&str> {
        self.segments().get(index).copied()
    }

    pub fn has_prefix(&self, prefix: &str) -> bool {
        self.topic.starts_with(prefix)
    }

    pub fn suffix_after(&self, prefix: &str) -> Option<&str> {
        if self.topic.starts_with(prefix) {
            let start_index = prefix.len();
            if start_index < self.topic.len() && self.topic.chars().nth(start_index) == Some('.') {
                Some(&self.topic[start_index + 1..])
            } else if start_index == self.topic.len() {
                Some("")
            } else {
                None
            }
        } else {
            None
        }
    }
}

fn match_with_single_wildcards(topic: &str, pattern: &str) -> bool {
    let topic_segments: Vec<&str> = topic.split('.').collect();
    let pattern_segments: Vec<&str> = pattern.split('.').collect();

    if topic_segments.len() != pattern_segments.len() {
        return false;
    }

    for (topic_seg, pattern_seg) in topic_segments.iter().zip(pattern_segments.iter()) {
        if *pattern_seg != "*" && *pattern_seg != *topic_seg {
            return false;
        }
    }

    true
}

#[allow(dead_code)]
pub trait NatsExt<'w, 's> {
    /// Filtre les événements par topic pattern
    fn filter_topic<T>(&mut self, topic: T) -> impl Iterator<Item = &NatsEvent>
    where
        T: AsRef<str>;

    /// Filtre par plusieurs patterns (OR logique)
    fn filter_topics(&mut self, topics: &[&str]) -> impl Iterator<Item = &NatsEvent>;

    /// Filtre par préfixe de topic
    fn filter_prefix(&mut self, prefix: &str) -> impl Iterator<Item = &NatsEvent>;

    /// Groupe les événements par segment de topic à un index donné
    fn group_by_segment(
        &mut self,
        segment_index: usize,
    ) -> std::collections::HashMap<String, Vec<&NatsEvent>>;

    /// Récupère tous les événements d'un système spécifique (premier segment)
    fn from_system(&mut self, system: &str) -> impl Iterator<Item = &NatsEvent>;

    /// Filtre les événements par payload contenant une chaîne
    fn filter_payload_contains(&mut self, content: &str) -> impl Iterator<Item = &NatsEvent>;

    /// Combine filtrage de topic et de payload
    fn filter_topic_and_payload<T>(
        &mut self,
        topic: T,
        payload_content: &str,
    ) -> impl Iterator<Item = &NatsEvent>
    where
        T: AsRef<str>;

    /// Compte les événements par topic pattern
    fn count_by_topic<T>(&mut self, topic: T) -> usize
    where
        T: AsRef<str>;

    /// Trouve le premier événement matchant un topic
    fn find_topic<T>(&mut self, topic: T) -> Option<&NatsEvent>
    where
        T: AsRef<str>;

    /// Collecte tous les topics uniques
    fn unique_topics(&mut self) -> std::collections::HashSet<String>;

    /// Filtre et mappe le payload avec parsing JSON
    fn filter_and_parse_json<F, R>(
        &mut self,
        topic_filter: &str,
        parser: F,
    ) -> impl Iterator<Item = R>
    where
        F: Fn(&str) -> Option<R> + Clone;
}

impl<'w, 's> NatsExt<'w, 's> for EventReader<'w, 's, NatsEvent> {
    fn filter_topic<T>(&mut self, topic: T) -> impl Iterator<Item = &NatsEvent>
    where
        T: AsRef<str>,
    {
        let topic_pattern = topic.as_ref().to_string();
        self.read()
            .filter(move |event| event.match_topic(&topic_pattern))
    }

    fn filter_topics(&mut self, topics: &[&str]) -> impl Iterator<Item = &NatsEvent> {
        let topics_vec: Vec<String> = topics.iter().map(|s| s.to_string()).collect();
        self.read()
            .filter(move |event| topics_vec.iter().any(|pattern| event.match_topic(pattern)))
    }

    fn filter_prefix(&mut self, prefix: &str) -> impl Iterator<Item = &NatsEvent> {
        let prefix_owned = prefix.to_string();
        self.read()
            .filter(move |event| event.has_prefix(&prefix_owned))
    }

    fn group_by_segment(
        &mut self,
        segment_index: usize,
    ) -> std::collections::HashMap<String, Vec<&NatsEvent>> {
        use std::collections::HashMap;

        let mut groups: HashMap<String, Vec<&NatsEvent>> = HashMap::new();

        for event in self.read() {
            if let Some(segment) = event.segment(segment_index) {
                groups
                    .entry(segment.to_string())
                    .or_insert_with(Vec::new)
                    .push(event);
            }
        }

        groups
    }

    fn from_system(&mut self, system: &str) -> impl Iterator<Item = &NatsEvent> {
        let system_owned = system.to_string();
        self.read()
            .filter(move |event| event.segment(0).map_or(false, |seg| seg == system_owned))
    }

    fn filter_payload_contains(&mut self, content: &str) -> impl Iterator<Item = &NatsEvent> {
        let content_owned = content.to_string();
        self.read()
            .filter(move |event| event.payload.contains(&content_owned))
    }

    fn filter_topic_and_payload<T>(
        &mut self,
        topic: T,
        payload_content: &str,
    ) -> impl Iterator<Item = &NatsEvent>
    where
        T: AsRef<str>,
    {
        let topic_pattern = topic.as_ref().to_string();
        let payload_content_owned = payload_content.to_string();

        self.read().filter(move |event| {
            event.match_topic(&topic_pattern) && event.payload.contains(&payload_content_owned)
        })
    }

    fn count_by_topic<T>(&mut self, topic: T) -> usize
    where
        T: AsRef<str>,
    {
        let topic_pattern = topic.as_ref().to_string();
        self.read()
            .filter(|event| event.match_topic(&topic_pattern))
            .count()
    }

    fn find_topic<T>(&mut self, topic: T) -> Option<&NatsEvent>
    where
        T: AsRef<str>,
    {
        let topic_pattern = topic.as_ref().to_string();
        self.read().find(|event| event.match_topic(&topic_pattern))
    }

    fn unique_topics(&mut self) -> std::collections::HashSet<String> {
        self.read().map(|event| event.topic.clone()).collect()
    }

    fn filter_and_parse_json<F, R>(
        &mut self,
        topic_filter: &str,
        parser: F,
    ) -> impl Iterator<Item = R>
    where
        F: Fn(&str) -> Option<R> + Clone,
    {
        let topic_pattern = topic_filter.to_string();

        self.read()
            .filter(move |event| event.match_topic(&topic_pattern))
            .filter_map(move |event| parser(&event.payload))
    }
}

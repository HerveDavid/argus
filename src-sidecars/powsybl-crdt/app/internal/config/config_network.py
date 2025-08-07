import logging
import xml.etree.ElementTree as ET
import pypowsybl.network as pn
from pathlib import Path
from typing import Optional


class ConfigNetwork:

    def __init__(self, config_loader, logger: Optional[logging.Logger] = None, base_directory: Optional[Path] = None):
        self.config_loader = config_loader
        self.logger = logger or logging.getLogger(__name__)
        self.base_directory = base_directory
        self._iidm_file_path: Optional[Path] = None
        self._job_file_path: Optional[Path] = None
        self._par_file_path: Optional[Path] = None
        self._par_id: Optional[str] = None
        self._network: Optional[pn.Network] = None

    def extract_network_info(self):
        if not self.config_loader.config:
            raise RuntimeError("Configuration not loaded")

        try:
            job_file = self.config_loader.get_parameter('input_files', 'job_file')
            if not job_file:
                raise ValueError("job_file not found in configuration")

            base_dir = self._determine_base_directory()

            self._job_file_path = base_dir / job_file

            if not self._job_file_path.exists():
                raise FileNotFoundError(f"Job file not found: {self._job_file_path}")

            network_info = self._parse_network_from_job_file(self._job_file_path)

            job_dir = self._job_file_path.parent

            if network_info['iidm_file']:
                self._iidm_file_path = job_dir / network_info['iidm_file']

            if network_info['par_file']:
                self._par_file_path = job_dir / network_info['par_file']

            self._par_id = network_info['par_id']

            self._network = pn.load(self.iidm_file_absolute_path)

            self.logger.info(f"Base directory: {base_dir}")
            self.logger.info(f"Job file: {self._job_file_path}")
            self.logger.info(f"IIDM file: {self._iidm_file_path}")
            self.logger.info(f"Par file: {self._par_file_path}")
            self.logger.info(f"Par ID: {self._par_id}")

        except Exception as e:
            self.logger.error(f"Error extracting network info: {e}")
            raise

    def _determine_base_directory(self) -> Path:
        if self.base_directory:
            self.logger.debug(f"Using explicit base directory: {self.base_directory}")
            return self.base_directory

        if self.config_loader.config_path:
            base_dir = self.config_loader.config_path.parent
            self.logger.debug(f"Using config file parent directory: {base_dir}")
            return base_dir

        base_dir = Path.cwd()
        self.logger.warning(f"No base directory specified, using current directory: {base_dir}")
        return base_dir

    def set_base_directory(self, directory: Path):
        self.base_directory = directory
        self.logger.info(f"Base directory set to: {directory}")

    def _parse_network_from_job_file(self, job_file_path: Path) -> dict:
        try:
            tree = ET.parse(job_file_path)
            root = tree.getroot()

            namespace = {'ns': 'http://www.rte-france.com/dynawo'}

            network_elem = root.find('.//ns:network', namespace)
            if network_elem is None:
                network_elem = root.find('.//network')

            if network_elem is None:
                raise ValueError("No network element found in job file")

            iidm_file = network_elem.get('iidmFile')
            par_file = network_elem.get('parFile')
            par_id = network_elem.get('parId')

            if not iidm_file:
                raise ValueError("No iidmFile attribute found in network element")

            return {
                'iidm_file': iidm_file,
                'par_file': par_file,
                'par_id': par_id
            }

        except ET.ParseError as e:
            raise ValueError(f"XML parsing error: {e}")
        except Exception as e:
            raise ValueError(f"Error parsing job file: {e}")

    @property
    def iidm_file_path(self) -> Optional[Path]:
        return self._iidm_file_path

    @property
    def iidm_file_absolute_path(self) -> Optional[str]:
        if self._iidm_file_path:
            return str(self._iidm_file_path.resolve())
        return None

    @property
    def par_file_path(self) -> Optional[Path]:
        return self._par_file_path

    @property
    def par_file_absolute_path(self) -> Optional[str]:
        if self._par_file_path:
            return str(self._par_file_path.resolve())
        return None

    @property
    def par_id(self) -> Optional[str]:
        return self._par_id

    @property
    def job_file_path(self) -> Optional[Path]:
        return self._job_file_path

    @property
    def iidm_network(self) -> Optional[pn.Network] :
        return self._network

    def validate_files_exist(self) -> bool:
        missing_files = []

        if self._iidm_file_path and not self._iidm_file_path.exists():
            missing_files.append(f"IIDM file: {self._iidm_file_path}")

        if self._par_file_path and not self._par_file_path.exists():
            missing_files.append(f"Parameter file: {self._par_file_path}")

        if self._job_file_path and not self._job_file_path.exists():
            missing_files.append(f"Job file: {self._job_file_path}")

        if missing_files:
            self.logger.error("Missing files:")
            for file in missing_files:
                self.logger.error(f"  - {file}")
            return False

        return True

    def get_network_summary(self) -> dict:
        return {
            "iidm_file_path": self.iidm_file_absolute_path,
            "par_file_path": self.par_file_absolute_path,
            "job_file_path": str(self._job_file_path) if self._job_file_path else None,
            "base_directory": str(self.base_directory) if self.base_directory else None,
        }
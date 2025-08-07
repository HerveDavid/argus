#!/usr/bin/env bash
# Ensure script exits on first error
set -e

# Detect OS
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    OS="Linux"
elif [[ "$OSTYPE" == "darwin"* ]]; then
    OS="MacOS"
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" || "$OSTYPE" == "cygwin" ]]; then
    OS="Windows"
else
    OS="Unknown"
fi
echo "Executing script on $OS platform"

# Create a temporary directory for spec files
TEMP_SPEC_DIR=$(mktemp -d)
echo "Using temporary directory for spec files: $TEMP_SPEC_DIR"

# Ensure the src-tauri/binaries/ directory exists
mkdir -p src-tauri/binaries/

# Function to setup and activate virtual environment for a given project
setup_venv() {
    local project_path=$1
    local project_name=$(basename "$project_path")

    echo "Setting up virtual environment for $project_name..."

    # Check if VIRTUAL_ENV is already set
    if [[ -z "$VIRTUAL_ENV" ]]; then
        echo "Virtual environment not active, setting it up..."

        # Check if venv directory exists
        if [[ ! -d "$project_path/venv" ]]; then
            echo "Creating virtual environment in $project_path/venv"
            python3 -m venv "$project_path/venv"
        else
            echo "Found existing virtual environment for $project_name"
        fi

        # Activate the virtual environment
        echo "Activating virtual environment for $project_name"
        source "$project_path/venv/bin/activate"

        # Store that we activated the venv in this script so we can deactivate later
        ACTIVATED_IN_SCRIPT=true
    else
        # Check if the active venv is in the expected location
        if [[ "$VIRTUAL_ENV" != *"$project_path"* ]]; then
            echo "Warning: The active virtual environment doesn't seem to be in $project_path"
            echo "Active venv: $VIRTUAL_ENV"
            read -p "Continue anyway? (y/n): " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                exit 1
            fi
        fi

        echo "Using existing virtual environment: $VIRTUAL_ENV"
        ACTIVATED_IN_SCRIPT=false
    fi

    # Install requirements if requirements.txt exists
    if [[ -f "$project_path/requirements.txt" ]]; then
        echo "Installing requirements from $project_path/requirements.txt..."
        pip install -r "$project_path/requirements.txt"
    else
        echo "No requirements.txt found in $project_path"
        echo "Installing PyInstaller..."
        pip install pyinstaller
    fi
}

# Function to deactivate venv if we activated it
cleanup_venv() {
    if [[ "$ACTIVATED_IN_SCRIPT" == "true" && -n "$VIRTUAL_ENV" ]]; then
        echo "Deactivating virtual environment"
        deactivate 2>/dev/null || true
    fi
}

# Function to clean up temporary directories
cleanup_temp_dirs() {
    echo "Cleaning up temporary spec directory..."
    rm -rf "$TEMP_SPEC_DIR"
}

# Function to build a Python project
build_python_project() {
    local project_path=$1
    local project_name=$2
    local binary_name_suffix=$3

    echo "Building $project_name..."

    # Setup virtual environment for this project
    setup_venv "$project_path"

    # Run PyInstaller
    echo "Running PyInstaller for $project_name on $OS..."
    pyinstaller -c -F --clean --specpath "$TEMP_SPEC_DIR" --name "$project_name-$binary_name_suffix" --distpath src-tauri/binaries/ "$project_path/main.py"

    # Cleanup venv after building this project
    cleanup_venv

    # Reset the flag for the next project
    ACTIVATED_IN_SCRIPT=false
}

# Set up trap to ensure cleanup on exit
trap 'cleanup_venv; cleanup_temp_dirs' EXIT

# OS-specific commands
case $OS in
    "Linux")
        echo "Executing Linux-specific commands..."
        build_python_project "src-sidecars/powsybl" "powsybl" "x86_64-unknown-linux-gnu"
        build_python_project "src-sidecars/powsybl-crdt" "powsybl-crdt" "x86_64-unknown-linux-gnu"
        ;;
    "MacOS")
        echo "Executing MacOS-specific commands..."
        build_python_project "src-sidecars/powsybl" "powsybl" "x86_64-apple-darwin"
        build_python_project "src-sidecars/powsybl-crdt" "powsybl-crdt" "x86_64-apple-darwin"
        ;;
    "Windows")
        echo "Executing Windows-specific commands..."
        build_python_project "src-sidecars/powsybl" "powsybl" "x86_64-pc-windows-msvc"
        build_python_project "src-sidecars/powsybl-crdt" "powsybl-crdt" "x86_64-pc-windows-msvc"
        ;;
    *)
        echo "Unsupported OS: $OS"
        exit 1
        ;;
esac

echo "Script execution completed successfully"
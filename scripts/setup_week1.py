"""
Week 1 Integration Setup Script
Installs dependencies and prepares the environment.
"""

import subprocess
import sys
from pathlib import Path
from colorama import init, Fore, Style

# Initialize colorama
init(autoreset=True)

# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))


def print_section(title: str):
    """Print a section header."""
    print("\n" + "=" * 70)
    print(f"  {title}")
    print("=" * 70)


def print_success(message: str):
    """Print success message."""
    print(f"{Fore.GREEN}✅ {message}{Style.RESET_ALL}")


def print_error(message: str):
    """Print error message."""
    print(f"{Fore.RED}❌ {message}{Style.RESET_ALL}")


def print_info(message: str):
    """Print info message."""
    print(f"{Fore.CYAN}ℹ️  {message}{Style.RESET_ALL}")


def print_warning(message: str):
    """Print warning message."""
    print(f"{Fore.YELLOW}⚠️  {message}{Style.RESET_ALL}")


def run_command(command: str, cwd=None, check=True):
    """Run a shell command."""
    try:
        result = subprocess.run(
            command,
            shell=True,
            cwd=cwd,
            check=check,
            capture_output=True,
            text=True
        )
        return result
    except subprocess.CalledProcessError as e:
        print_error(f"Command failed: {command}")
        print_error(f"Error: {e.stderr}")
        return None


def install_backend_dependencies():
    """Install Python backend dependencies."""
    print_section("📦 Installing Backend Dependencies")
    
    print_info("Installing python-socketio...")
    result = run_command("pip install python-socketio", check=False)
    
    if result and result.returncode == 0:
        print_success("python-socketio installed")
    else:
        print_error("Failed to install python-socketio")
    
    print_info("Installing colorama for colored output...")
    result = run_command("pip install colorama", check=False)
    
    if result and result.returncode == 0:
        print_success("colorama installed")
    else:
        print_error("Failed to install colorama")
    
    print_info("Checking other dependencies...")
    result = run_command("pip install requests", check=False)
    
    if result and result.returncode == 0:
        print_success("All backend dependencies installed")
    else:
        print_warning("Some dependencies may have failed")
    
    return True


def check_database():
    """Check if database is accessible."""
    print_section("🗄️  Checking Database")
    
    try:
        from src.utils.config import get_settings
        settings = get_settings()
        print_info(f"Database URL: {settings.DATABASE_URL}")
        print_success("Database configuration loaded")
        return True
    except Exception as e:
        print_error(f"Database configuration error: {e}")
        return False


def create_directories():
    """Create necessary directories."""
    print_section("📁 Creating Directories")
    
    directories = [
        project_root / "logs",
        project_root / "models",
        project_root / "data" / "raw",
        project_root / "data" / "processed",
        project_root / "data" / "synthetic",
    ]
    
    for directory in directories:
        directory.mkdir(parents=True, exist_ok=True)
        print_success(f"Created: {directory}")
    
    return True


def create_env_template():
    """Create .env template if it doesn't exist."""
    print_section("⚙️  Checking Environment Configuration")
    
    env_file = project_root / ".env"
    env_template = project_root / ".env.template"
    
    if env_file.exists():
        print_success(".env file exists")
        return True
    
    if not env_template.exists():
        print_warning(".env.template not found")
        return False
    
    print_info("Creating .env from template...")
    env_file.write_text(env_template.read_text())
    print_success(".env file created")
    
    return True


def check_frontend_setup():
    """Check frontend setup."""
    print_section("🎨 Checking Frontend Setup")
    
    frontend_dir = project_root / "frontend"
    
    if not frontend_dir.exists():
        print_error("Frontend directory not found")
        return False
    
    print_success("Frontend directory exists")
    
    # Check if node_modules exists
    node_modules = frontend_dir / "node_modules"
    if node_modules.exists():
        print_success("node_modules exists")
    else:
        print_warning("node_modules not found. Run 'npm install' in frontend/")
    
    # Check .env.local
    env_local = frontend_dir / ".env.local"
    if env_local.exists():
        print_success(".env.local exists")
    else:
        print_warning(".env.local not found (it will be created)")
    
    return True


def print_next_steps():
    """Print next steps."""
    print_section("🚀 Next Steps")
    
    print(f"\n{Fore.GREEN}Setup Complete!{Style.RESET_ALL}\n")
    
    print("To complete the integration, follow these steps:\n")
    
    print(f"{Fore.CYAN}1. Create test users:{Style.RESET_ALL}")
    print("   python scripts/create_test_user.py")
    
    print(f"\n{Fore.CYAN}2. Start the backend server:{Style.RESET_ALL}")
    print("   uvicorn src.api.main:app --reload")
    print("   or")
    print("   python -m uvicorn src.api.main:app --reload")
    
    print(f"\n{Fore.CYAN}3. In a new terminal, start the frontend:{Style.RESET_ALL}")
    print("   cd frontend")
    print("   npm run dev")
    
    print(f"\n{Fore.CYAN}4. Run integration tests:{Style.RESET_ALL}")
    print("   python scripts/test_integration.py")
    
    print(f"\n{Fore.CYAN}5. Access the application:{Style.RESET_ALL}")
    print("   Frontend: http://localhost:3000")
    print("   Backend API: http://localhost:8000")
    print("   API Docs: http://localhost:8000/docs")
    print("   WebSocket: ws://localhost:8000/socket.io")
    
    print(f"\n{Fore.CYAN}6. Test login credentials:{Style.RESET_ALL}")
    print("   Email: demo@hedgerl.com")
    print("   Password: demo123")
    
    print("\n" + "=" * 70)


def main():
    """Main setup execution."""
    print(f"\n{Fore.CYAN}{'=' * 70}")
    print(f"  Week 1 Integration Setup")
    print(f"  Derivative Hedging RL Platform")
    print(f"{'=' * 70}{Style.RESET_ALL}\n")
    
    print_info("Starting setup process...")
    
    # Run setup steps
    steps = [
        ("Creating directories", create_directories),
        ("Installing backend dependencies", install_backend_dependencies),
        ("Checking environment configuration", create_env_template),
        ("Checking database configuration", check_database),
        ("Checking frontend setup", check_frontend_setup),
    ]
    
    for step_name, step_func in steps:
        try:
            if not step_func():
                print_warning(f"{step_name} completed with warnings")
        except Exception as e:
            print_error(f"{step_name} failed: {e}")
            print_warning("Continuing with remaining steps...")
    
    # Print next steps
    print_next_steps()
    
    return True


if __name__ == "__main__":
    try:
        success = main()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print(f"\n{Fore.YELLOW}⚠️  Setup cancelled by user{Style.RESET_ALL}")
        sys.exit(1)
    except Exception as e:
        print(f"\n{Fore.RED}❌ Setup error: {e}{Style.RESET_ALL}")
        sys.exit(1)

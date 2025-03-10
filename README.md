# Peripheral Vision Training

## Overview
The Peripheral Vision Training project is a web-based application designed to enhance and assess peripheral vision through interactive exercises. It offers two modes—**Testing** and **Training**—with customizable settings for speed and duration, guided by research on visual reaction and cognitive psychology. This project is built using HTML, CSS, JavaScript, and the Django framework, making it scalable and adaptable for various use cases, from casual users to clinical or athletic training.

### Purpose
- **Testing Mode**: Measures peripheral vision reliability by presenting blue blips at adjustable speeds (default: 1 Hz, range: 0.5–2 Hz) for a set duration (default: 60s, range: 30–180s).
- **Training Mode**: Improves peripheral awareness with a time gap between center and corner colors (default: 1000ms, range: 500–2000ms) over a longer duration (default: 120s, range: 60–300s).

### Features (Current)
- **Page 1**: Initial screen with a "Start Training" button.
- **Page 2**: Mode selection between Testing and Training.
- **Page 3**: Settings page to adjust speed and duration with recommended defaults and user-modifiable ranges.
- Responsive design for various screen sizes.

## Prerequisites
Before you begin, ensure you have the following installed:

### 1. Visual Studio Code
1. Visit [VS Code official website](https://code.visualstudio.com/)
2. Download the appropriate version for your operating system
3. Install and follow the setup wizard
4. Recommended extensions:
   - Python
   - Django
   - Live Server
   - Git Lens

### 2. Python
1. Visit [Python official website](https://www.python.org/)
2. Download Python 3.8 or later
3. During installation:
   - ✅ Add Python to PATH
   - ✅ Install pip
4. Verify installation:
   ```bash
   python --version
   pip --version
   ```

### 3. Django
1. Open terminal/command prompt
2. Install Django using pip:
   ```bash
   pip install django
   ```
3. Verify installation:
   ```bash
   django-admin --version
   ```

## Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/A-THIF/peripheral-vision-training
   ```
2. Navigate to project directory:
   ```bash
   cd peripheral-vision-training
   ```
3. Create virtual environment:
   ```bash
   python -m venv venv
   ```
4. Activate virtual environment:
   - Windows:
     ```bash
     venv\Scripts\activate
     ```
   - Mac/Linux:
     ```bash
     source venv/bin/activate
     ```
5. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

## Usage
1. Run the development server:
   ```bash
   python manage.py runserver
   ```
2. Open your browser and navigate to:
   ```
   http://127.0.0.1:8000/
   ```
3. Follow the on-screen instructions to:
   - Select your preferred mode (Testing/Training)
   - Adjust settings if needed
   - Begin your session

## Development
- **Database**: SQLite (default)
- **Frontend**: HTML5, CSS3, JavaScript
- **Backend**: Django 4.x
- **Python**: 3.8+

## Contributing
1. Fork the repository
2. Create your feature branch:
   ```bash
   git checkout -b feature/YourFeature
   ```
3. Commit your changes:
   ```bash
   git commit -m 'Add some feature'
   ```
4. Push to the branch:
   ```bash
   git push origin feature/YourFeature
   ```
5. Create a Pull Request

## Troubleshooting
- **Server won't start**: Check if port 8000 is available
- **Missing dependencies**: Run `pip install -r requirements.txt` again
- **Database issues**: Delete db.sqlite3 and run migrations:
  ```bash
  python manage.py makemigrations
  python manage.py migrate
  ```

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact
- **Developer**: TEAM AHEAD
- **Email**: nmohamedathif@gmail.com
- **Project Link**: [GitHub Repository](https://github.com/A-THIF/peripheral-vision-training)

# Annotation Tool
[![Flask](https://img.shields.io/badge/Flask-000000?style=flat&logo=flask&logoColor=white)](https://pypi.org/project/Flask/) [![Jinja2](https://img.shields.io/badge/Jinja2-B41717?style=flat&logo=jinja&logoColor=white)](https://pypi.org/project/Jinja2/) [![Bootstrap](https://img.shields.io/badge/Bootstrap-563D7C?style=flat&logo=bootstrap&logoColor=white)](https://pypi.org/project/bootstrap-flask/) [![Pandas](https://img.shields.io/badge/Pandas-150458?style=flat&logo=pandas&logoColor=white)](https://pypi.org/project/pandas/) [![jQuery](https://img.shields.io/badge/jQuery-0769AD?style=flat&jquery&logoColor=white)](https://code.jquery.com/jquery-3.6.0.min.js)

## Steps to Run

### 1. Install Python
Download and install Python from [here](https://www.python.org/downloads/).

### 2. Create a Virtual Environment
a. Open a terminal or command prompt.
b. Navigate to your project directory.
c. Run the following commands to create and activate a virtual environment:
   ```bash
   python -m venv venv
   # On Windows
   .\venv\Scripts\activate
   # On macOS and Linux
   source venv/bin/activate
   ```

### 3. Install Requirements
a. Ensure you have activated your virtual environment
b. Run the following command to install the required packages:
   ```bash
    pip install -r requirements.txt
   ```
c. If you are working in an HTRC data capsule, run the following command instead:
   ```bash
    pip install -r requirements_htrc.txt
   ```

### 4. Finally, Run the Application
a. Run the following command to start the Flask application
   ```bash
    flask run
   ```
b. Visit http://127.0.0.1:5000 in your web browser to access the interface.
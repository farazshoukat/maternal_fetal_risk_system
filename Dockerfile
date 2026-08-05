FROM python:3.9-slim

WORKDIR /code

# Copy requirements and install dependencies
COPY ./backend/requirements.txt /code/requirements.txt
RUN pip install --no-cache-dir --upgrade -r /code/requirements.txt

# Copy the entire backend directory
COPY ./backend /code/backend

# Set the working directory to the backend folder so the imports (e.g. app.main) work correctly
WORKDIR /code/backend

# Hugging Face Spaces requires the app to run on port 7860
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "7860"]

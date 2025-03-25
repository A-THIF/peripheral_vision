import cv2
import numpy as np
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from django.shortcuts import render
import base64
import json

# Load the Haar Cascade classifier for face detection
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

# Constants for distance calculation
REAL_FACE_WIDTH = 14  # Average face width in cm
FOCAL_LENGTH = 670  # Needs calibration for your webcam (we'll calibrate later)

def start(request):
    return render(request, 'start.html')

def training(request):
    return render(request, 'training.html')

def onspot_distance_detection(request):
    # Pass the required distance from the URL parameter to the template
    required_distance = request.GET.get('required_distance', '0')
    return render(request, 'onspot_distance_detection.html', {'required_distance': required_distance})

@csrf_exempt
@require_POST
def calculate_distance(request):
    try:
        # Parse the request body (expecting a JSON with a base64-encoded image)
        data = json.loads(request.body)
        image_data = data.get('image', '')

        # Decode the base64 image
        image_data = image_data.split(',')[1]  # Remove the "data:image/jpeg;base64," prefix
        image_bytes = base64.b64decode(image_data)
        nparr = np.frombuffer(image_bytes, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        # Convert to grayscale for face detection
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

        # Detect faces
        faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30))

        if len(faces) > 0:
            # Take the first detected face
            (x, y, w, h) = faces[0]
            face_width_pixels = w

            # Calculate distance
            if face_width_pixels > 0:
                distance = (FOCAL_LENGTH * REAL_FACE_WIDTH) / face_width_pixels
                distance = round(distance, 2)
                return JsonResponse({'distance': distance, 'status': 'success'})
            else:
                return JsonResponse({'status': 'error', 'message': 'Invalid face width detected.'})
        else:
            return JsonResponse({'status': 'error', 'message': 'No face detected.'})

    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)})
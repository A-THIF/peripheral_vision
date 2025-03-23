from django.shortcuts import render
from .models import VisionTestResult
import json
from django.http import JsonResponse

def start_page(request):
    return render(request, 'start.html')

def test_page(request):
    return render(request, 'training.html')

def report_page(request):
    # Fetch the latest result for simplicity (improve with user sessions later)
    latest_result = VisionTestResult.objects.last()
    return render(request, 'report.html', {'result': latest_result})
    

def save_result(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        result = VisionTestResult(
            speed_mode=data['speed_mode'],
            field_left=data['field_left'],
            field_right=data['field_right'],
            missed_count=data['missed_count']
        )
        result.save()
        return JsonResponse({'status': 'success', 'id': result.id})
    return JsonResponse({'status': 'error'})

def onspot_distance_detection(request):
    return render(request, 'onspot_distance_detection.html')
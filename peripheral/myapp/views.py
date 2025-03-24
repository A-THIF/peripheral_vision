from django.shortcuts import render, redirect
from django.http import JsonResponse
from .models import SessionSettings, TrainingResult
from django.contrib.auth.decorators import login_required  # Optional: If you implement user authentication

def start_page(request):
    if request.method == 'POST':
        # Collect data from the start page form
        mode = request.POST.get('mode')
        speed = float(request.POST.get('speed', 500 if mode == 'training' else 1))
        time_limit = int(request.POST.get('time_limit', 120))
        selection_timeout = int(request.POST.get('selection_timeout', 1200))
        central_to_selection_gap = int(request.POST.get('central_to_selection_gap', 500))
        selection_to_central_gap = int(request.POST.get('selection_to_central_gap', 1000))
        screen_size = float(request.POST.get('screen_size', 19))
        viewing_distance = float(request.POST.get('viewing_distance', screen_size * 1.5 * 2.54))
        device_type = request.POST.get('device_type', 'desktop')
        resolution_width = int(request.POST.get('resolution_width', 1920))
        resolution_height = int(request.POST.get('resolution_height', 1080))

        # Save the session settings to the database
        session = SessionSettings.objects.create(
            user=request.user if request.user.is_authenticated else None,  # Link to user if authenticated
            mode=mode,
            speed=speed,
            time_limit=time_limit,
            selection_timeout=selection_timeout,
            central_to_selection_gap=central_to_selection_gap,
            selection_to_central_gap=selection_to_central_gap,
            screen_size=screen_size,
            viewing_distance=viewing_distance,
            device_type=device_type,
            resolution_width=resolution_width,
            resolution_height=resolution_height,
        )

        # Redirect to the training page with session ID
        params = {
            'mode': mode,
            'speed': speed,
            'time_limit': time_limit,
            'selection_timeout': selection_timeout,
            'central_to_selection_gap': central_to_selection_gap,
            'selection_to_central_gap': selection_to_central_gap,
            'screen_size': screen_size,
            'viewing_distance': viewing_distance,
            'device_type': device_type,
            'resolution_width': resolution_width,
            'resolution_height': resolution_height,
            'session_id': session.id,  # Pass session ID to link results
        }
        query_string = '&'.join([f"{key}={value}" for key, value in params.items()])
        return redirect(f'/training/?{query_string}')

    return render(request, 'start.html')  # Replace with your start page template

def training_page(request):
    # Pass the URL parameters to the template
    return render(request, 'training.html', {
        'mode': request.GET.get('mode', 'training'),
        'speed': request.GET.get('speed', '500'),
        'time_limit': request.GET.get('time_limit', '120'),
        'selection_timeout': request.GET.get('selection_timeout', '1200'),
        'central_to_selection_gap': request.GET.get('central_to_selection_gap', '500'),
        'selection_to_central_gap': request.GET.get('selection_to_central_gap', '1000'),
        'screen_size': request.GET.get('screen_size', '19'),
        'viewing_distance': request.GET.get('viewing_distance', '19 * 1.5 * 2.54'),
        'device_type': request.GET.get('device_type', 'desktop'),
        'resolution_width': request.GET.get('resolution_width', '1920'),
        'resolution_height': request.GET.get('resolution_height', '1080'),
        'session_id': request.GET.get('session_id', ''),
    })

def save_training_results(request):
    if request.method == 'POST':
        # Collect training results from the request
        session_id = request.POST.get('session_id')
        score = int(request.POST.get('score', 0))
        total_attempts = int(request.POST.get('total_attempts', 0))
        correct = int(request.POST.get('correct', 0))
        missed = int(request.POST.get('missed', 0))
        wrong = int(request.POST.get('wrong', 0))
        accuracy = float(request.POST.get('accuracy', 0.0))

        # Retrieve the session
        try:
            session = SessionSettings.objects.get(id=session_id)
        except SessionSettings.DoesNotExist:
            return JsonResponse({'status': 'error', 'message': 'Session not found'}, status=404)

        # Save the training results
        TrainingResult.objects.create(
            session=session,
            score=score,
            total_attempts=total_attempts,
            correct=correct,
            missed=missed,
            wrong=wrong,
            accuracy=accuracy,
        )
        return JsonResponse({'status': 'success'})
    return JsonResponse({'status': 'error', 'message': 'Invalid request'}, status=400)
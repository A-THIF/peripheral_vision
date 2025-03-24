from django.urls import path
from . import views

urlpatterns = [
<<<<<<< Updated upstream
    path('', views.start_page, name='start_page'),
    path('training/', views.test_page, name='test_page'),
    path('report/', views.report_page, name='report_page'),
    path('save_result/', views.save_result, name='save_result'),
=======
    path('', views.start, name='start'),
    path('training/', views.training, name='training'),
    path('onspot-distance-detection/', views.onspot_distance_detection, name='onspot_distance_detection'),
    path('calculate-distance/', views.calculate_distance, name='calculate_distance'),
>>>>>>> Stashed changes
]
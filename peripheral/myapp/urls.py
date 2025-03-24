from django.urls import path
from . import views

urlpatterns = [
    path('', views.start, name='start'),
    path('training/', views.training, name='training'),
    path('onspot-distance-detection/', views.onspot_distance_detection, name='onspot_distance_detection'),
    path('calculate-distance/', views.calculate_distance, name='calculate_distance'),
    path('save-results/', views.save_training_results, name='save_training_results'),
]
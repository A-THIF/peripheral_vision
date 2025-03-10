from django.urls import path
from . import views

urlpatterns = [
    path('', views.start_page, name='start_page'),
    path('test/', views.test_page, name='test_page'),
    path('report/', views.report_page, name='report_page'),
    path('save_result/', views.save_result, name='save_result'),
]
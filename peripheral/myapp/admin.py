from django.contrib import admin
from .models import SessionSettings, TrainingResult

class TrainingResultInline(admin.TabularInline):
    model = TrainingResult
    extra = 0  # No extra empty forms
    readonly_fields = ('score', 'total_attempts', 'correct', 'missed', 'wrong', 'accuracy', 'completed_at')
    can_delete = False

@admin.register(SessionSettings)
class SessionSettingsAdmin(admin.ModelAdmin):
    list_display = ('mode', 'speed', 'time_limit', 'screen_size', 'device_type', 'created_at')
    list_filter = ('mode', 'device_type', 'created_at')
    search_fields = ('mode', 'device_type')
    inlines = [TrainingResultInline]
    readonly_fields = ('created_at',)

@admin.register(TrainingResult)
class TrainingResultAdmin(admin.ModelAdmin):
    list_display = ('session', 'score', 'correct', 'missed', 'wrong', 'accuracy', 'completed_at')
    list_filter = ('completed_at', 'session__mode')
    search_fields = ('session__mode',)
    readonly_fields = ('completed_at',)
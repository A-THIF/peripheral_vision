from django.db import models

class VisionTestResult(models.Model):
    timestamp = models.DateTimeField(auto_now_add=True)
    speed_mode = models.BooleanField(default=False)
    field_left = models.IntegerField(default=0)
    field_right = models.IntegerField(default=0)
    missed_count = models.IntegerField(default=0)

    def __str__(self):
        return f"Test {self.timestamp} (Speed: {self.speed_mode})"

class SessionSettings(models.Model):
    # Fields for settings entered on the start page
    user = models.ForeignKey('auth.User', on_delete=models.SET_NULL, null=True, blank=True)  # Optional: Link to a user
    mode = models.CharField(max_length=20, choices=[('training', 'Training'), ('testing', 'Testing')])
    speed = models.FloatField(help_text="Speed in ms (Training) or Hz (Testing)")
    time_limit = models.IntegerField(help_text="Time limit in seconds")
    selection_timeout = models.IntegerField(help_text="Selection timeout in ms")
    central_to_selection_gap = models.IntegerField(help_text="Gap after central light in ms")
    selection_to_central_gap = models.IntegerField(help_text="Gap after selection in ms")
    screen_size = models.FloatField(help_text="Screen size in inches")
    viewing_distance = models.FloatField(help_text="Viewing distance in cm")
    device_type = models.CharField(max_length=20, choices=[('desktop', 'Desktop'), ('laptop', 'Laptop')])
    resolution_width = models.IntegerField()
    resolution_height = models.IntegerField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.mode} Session - {self.created_at}"

class TrainingResult(models.Model):
    # Link to the session settings used for this training
    session = models.ForeignKey(SessionSettings, on_delete=models.CASCADE, related_name='results')
    score = models.IntegerField(default=0)
    total_attempts = models.IntegerField(default=0)
    correct = models.IntegerField(default=0)
    missed = models.IntegerField(default=0)
    wrong = models.IntegerField(default=0)
    accuracy = models.FloatField(default=0.0, help_text="Accuracy in percentage")
    completed_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Result for {self.session} - Score: {self.score}"
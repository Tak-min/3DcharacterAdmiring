# /app/core/animation_mapper.py

def get_animation_for_emotion(emotion_data: dict) -> str:
    """
    Maps emotion data to a specific animation clip name.

    Args:
        emotion_data: A dictionary with "emotion" (str) and "intensity" (float).

    Returns:
        The name of the animation clip to play.
    """
    emotion = emotion_data.get("emotion", "neutral").lower()
    intensity = emotion_data.get("intensity", 0.5)

    # Simple mapping logic. This can be expanded with more complex rules.
    if emotion == "joy":
        return "Idle_Happy" if intensity < 0.7 else "Laugh"
    elif emotion == "sadness":
        return "Idle_Sad"
    elif emotion == "agreement":
        return "Nod_Head_Yes"
    elif emotion == "surprise":
        return "Look_Around_Surprised"
    elif emotion == "anger":
        return "Shake_Head_No" # Or a more specific angry animation
    elif emotion == "curiosity":
        return "Thinking_Pose"
    elif emotion == "thoughtful":
        return "Thinking_Pose"
    elif emotion == "neutral":
        return "Idle_Neutral"
    else:
        return "Idle_Neutral" # Default fallback

from sqlalchemy.orm import Session
from app.models import ActivityLog, Notification, User
from typing import Optional

def log_activity(
    db: Session,
    user_id: Optional[int],
    action: str,
    entity_type: str,
    entity_id: Optional[int] = None,
    details: Optional[str] = None
):
    try:
        activity = ActivityLog(
            user_id=user_id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            details=details
        )
        db.add(activity)
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Error logging activity: {e}")

def create_notification(
    db: Session,
    user_id: int,
    title: str,
    message: str,
    notification_type: str = "INFO",
    link_url: Optional[str] = None
):
    try:
        notif = Notification(
            user_id=user_id,
            title=title,
            message=message,
            notification_type=notification_type,
            link_url=link_url
        )
        db.add(notif)
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Error creating notification: {e}")

from sqlalchemy import Column, String, Integer, Text, DateTime, Boolean, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

Base = declarative_base()

def gen_id():
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"
    id           = Column(String, primary_key=True, default=gen_id)
    email        = Column(String, unique=True, nullable=False)
    name         = Column(String, default="")
    password_hash = Column(String, nullable=False)
    created_at   = Column(DateTime, default=datetime.utcnow)

    linkedin = relationship("LinkedInAccount", back_populates="user", uselist=False)
    posts    = relationship("Post", back_populates="user")
    topics   = relationship("AutomationTopic", back_populates="user")
    settings = relationship("UserSettings", back_populates="user", uselist=False)


class UserSettings(Base):
    __tablename__ = "user_settings"
    id              = Column(String, primary_key=True, default=gen_id)
    user_id         = Column(String, ForeignKey("users.id"), unique=True)
    openai_key      = Column(Text, default="")
    gemini_key      = Column(Text, default="")
    default_ai      = Column(String, default="claude")    # claude | openai | gemini
    pipeline_active = Column(Boolean, default=False)
    pipeline_freq   = Column(String, default="daily")      # hourly|daily|twice|weekly
    pipeline_time   = Column(String, default="09:00")
    auto_post       = Column(Boolean, default=False)       # if true, pipeline posts directly; else queues for approval
    gen_image       = Column(Boolean, default=True)

    user = relationship("User", back_populates="settings")


class LinkedInAccount(Base):
    __tablename__ = "linkedin_accounts"
    id            = Column(String, primary_key=True, default=gen_id)
    user_id       = Column(String, ForeignKey("users.id"), unique=True)
    access_token  = Column(Text, nullable=False)
    expires_at    = Column(DateTime)
    li_person_id  = Column(String)
    li_name       = Column(String)
    li_avatar     = Column(String)
    connected_at  = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="linkedin")


class AutomationTopic(Base):
    __tablename__ = "automation_topics"
    id         = Column(String, primary_key=True, default=gen_id)
    user_id    = Column(String, ForeignKey("users.id"))
    topic      = Column(Text, nullable=False)
    tone       = Column(String, default="Professional")
    active     = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="topics")


class Post(Base):
    __tablename__ = "posts"
    id              = Column(String, primary_key=True, default=gen_id)
    user_id         = Column(String, ForeignKey("users.id"))

    content         = Column(Text, nullable=False)
    image_url       = Column(Text, default="")
    image_prompt    = Column(Text, default="")

    status          = Column(String, default="draft")
    # draft | pending | approved | posted | rejected | failed

    topic           = Column(String, default="")
    tone            = Column(String, default="Professional")
    ai_provider     = Column(String, default="")

    auto            = Column(Boolean, default=False)       # created by automation pipeline
    revised         = Column(Boolean, default=False)        # regenerated after a rejection
    reject_reason   = Column(Text, default="")
    reject_type     = Column(String, default="")            # content | image | both

    scheduled_at    = Column(DateTime, nullable=True)
    posted_at       = Column(DateTime, nullable=True)
    li_post_id      = Column(String, default="")

    likes           = Column(Integer, default=0)
    comments        = Column(Integer, default=0)
    impressions     = Column(Integer, default=0)

    celery_task_id  = Column(String, default="")
    created_at      = Column(DateTime, default=datetime.utcnow)
    updated_at      = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="posts")

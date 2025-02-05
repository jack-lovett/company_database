"""Staff project model for SQL database."""
from sqlalchemy import Integer, Column, ForeignKey

from models.base import Base


class StaffProject(Base):
    __tablename__ = "staff_project"

    staff_id = Column(Integer, ForeignKey('staff.staff_id'), primary_key=True)
    project_id = Column(Integer, ForeignKey('project.project_id'), primary_key=True)

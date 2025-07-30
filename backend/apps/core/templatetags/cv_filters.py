"""
Custom Django template filters for CV templates
These filters replicate the Handlebars helpers used in the Node.js templates
"""

from django import template
from django.utils.safestring import mark_safe
from urllib.parse import urlparse
import re

register = template.Library()


@register.filter
def is_url(value):
    """Check if a value is a valid URL"""
    if not value:
        return False
    try:
        result = urlparse(str(value))
        return all([result.scheme, result.netloc])
    except:
        return False


@register.filter
def mul(value, arg):
    """Multiply two values"""
    try:
        return int(value) * int(arg)
    except (ValueError, TypeError):
        return 0


@register.filter
def has_items(value):
    """Check if a list/queryset has items"""
    if not value:
        return False
    try:
        return len(value) > 0
    except TypeError:
        return bool(value)


@register.filter
def join_with_separator(value, separator=", "):
    """Join a list of items with a separator"""
    if not value:
        return ""
    try:
        if hasattr(value, 'all'):  # QuerySet
            items = [str(item) for item in value.all()]
        else:  # List
            items = [str(item) for item in value]
        return separator.join(items)
    except:
        return str(value)


@register.filter
def technologies_list(technologies, separator=", "):
    """Format technologies list - equivalent to Handlebars technologiesList helper"""
    if not technologies:
        return ""
    
    if isinstance(technologies, str):
        # If it's already a string, return as is
        return technologies
    
    try:
        if hasattr(technologies, 'all'):  # QuerySet
            tech_names = [tech.name for tech in technologies.all()]
        elif isinstance(technologies, list):
            # Handle list of technology objects or strings
            tech_names = []
            for tech in technologies:
                if hasattr(tech, 'name'):
                    tech_names.append(tech.name)
                else:
                    tech_names.append(str(tech))
        else:
            return str(technologies)
        
        return separator.join(tech_names)
    except:
        return str(technologies)


@register.simple_tag
def group_skills(skills):
    """Group skills by category - equivalent to Handlebars groupSkills helper"""
    if not skills:
        return []
    
    grouped = {}
    try:
        if hasattr(skills, 'all'):  # QuerySet
            skills_list = list(skills.all())
        else:
            skills_list = list(skills)
        
        for skill in skills_list:
            category = getattr(skill, 'category', 'Other')
            if category not in grouped:
                grouped[category] = []
            grouped[category].append(skill)
        
        # Convert to list of dicts for template iteration
        result = []
        for category, skill_list in grouped.items():
            result.append({
                'grouper': category,
                'list': skill_list
            })
        
        return result
    except:
        return []


@register.filter
def format_date(date_value, format_string="M Y"):
    """Format date - equivalent to Handlebars formatDate helper"""
    if not date_value:
        return ""
    
    try:
        if format_string == "M Y":
            return date_value.strftime("%b %Y")
        elif format_string == "Y":
            return date_value.strftime("%Y")
        elif format_string == "M d, Y":
            return date_value.strftime("%b %d, %Y")
        else:
            return date_value.strftime(format_string)
    except:
        return str(date_value)


@register.simple_tag
def or_check(*args):
    """Check if any of the arguments is truthy - equivalent to Handlebars (or ...) helper"""
    return any(args)


@register.simple_tag
def and_check(*args):
    """Check if all arguments are truthy - equivalent to Handlebars (and ...) helper"""
    return all(args)


@register.filter
def safe_html(value):
    """Mark HTML content as safe - equivalent to triple braces in Handlebars"""
    if not value:
        return ""
    return mark_safe(str(value))
"""Tests for goal estimation engine formulas."""

import pytest

from apps.intelligence.services.goal_engine import (
    GoalInput,
    calculate_bmr,
    calculate_tdee,
    estimate_goal,
)


def test_bmr_male():
    # (10 × 80) + (6.25 × 180) - (5 × 30) + 5 = 800 + 1125 - 150 + 5 = 1780
    assert calculate_bmr(80, 180, 30, "male") == 1780


def test_bmr_female():
    # (10 × 65) + (6.25 × 165) - (5 × 28) - 161 = 650 + 1031.25 - 140 - 161 = 1380.25
    assert calculate_bmr(65, 165, 28, "female") == 1380.25


def test_tdee_moderate():
    bmr = 1780
    assert calculate_tdee(bmr, "moderate") == 1780 * 1.55


def test_fat_loss_estimate():
    inp = GoalInput(
        age=30,
        gender="male",
        height_cm=180,
        weight_kg=90,
        target_weight_kg=80,
        activity_level="moderate",
        goal_type="fat_loss",
        experience_level="intermediate",
        calorie_adjustment=500,
    )
    result = estimate_goal(inp)
    assert result.calorie_target == result.tdee - 500
    assert result.weekly_loss_kg == pytest.approx((500 * 7) / 7700, rel=0.01)
    assert result.weeks_needed is not None
    assert result.weeks_needed > 0
    assert len(result.weekly_weight_projection) > 0


def test_muscle_gain_estimate():
    inp = GoalInput(
        age=25,
        gender="male",
        height_cm=175,
        weight_kg=70,
        target_weight_kg=75,
        activity_level="active",
        goal_type="muscle_gain",
        experience_level="beginner",
        calorie_adjustment=300,
    )
    result = estimate_goal(inp)
    assert result.calorie_target == result.tdee + 300
    assert result.weekly_gain_kg is not None
    assert result.confidence_score > 0

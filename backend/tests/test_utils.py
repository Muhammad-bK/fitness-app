from decimal import Decimal

from apps.workouts.utils import (
    calculate_set_volume,
    convert_to_kg,
    display_weight,
    estimate_one_rep_max,
    format_rest_time,
    kg_to_lbs,
    lbs_to_kg,
)


class TestUnitConversion:
    def test_kg_to_lbs(self):
        assert kg_to_lbs(Decimal("100")) == Decimal("220.46")

    def test_lbs_to_kg(self):
        assert lbs_to_kg(Decimal("220.46")) == Decimal("100.00")

    def test_round_trip(self):
        original = Decimal("80.00")
        assert lbs_to_kg(kg_to_lbs(original)) == original

    def test_display_weight_kg(self):
        assert display_weight(Decimal("80"), "kg") == Decimal("80")

    def test_display_weight_lbs(self):
        assert display_weight(Decimal("100"), "lbs") == Decimal("220.46")

    def test_convert_to_kg_from_lbs(self):
        assert convert_to_kg(Decimal("176"), "lbs") == Decimal("79.83")

    def test_convert_to_kg_from_kg(self):
        assert convert_to_kg(Decimal("80"), "kg") == Decimal("80")


class TestEstimateOneRepMax:
    def test_epley_known_values(self):
        # 100kg × 5 reps → 100 × (1 + 5/30) = 100 × 1.1667 = 116.67
        assert estimate_one_rep_max(Decimal("100"), 5) == Decimal("116.67")

    def test_single_rep_returns_weight(self):
        assert estimate_one_rep_max(Decimal("140"), 1) == Decimal("140")

    def test_zero_reps_returns_zero(self):
        assert estimate_one_rep_max(Decimal("100"), 0) == Decimal("0")

    def test_zero_weight_returns_zero(self):
        assert estimate_one_rep_max(Decimal("0"), 5) == Decimal("0")

    def test_none_weight_returns_zero(self):
        assert estimate_one_rep_max(None, 5) == Decimal("0")


class TestVolume:
    def test_set_volume(self):
        assert calculate_set_volume(Decimal("80"), 8) == Decimal("640.00")

    def test_none_weight_returns_zero(self):
        assert calculate_set_volume(None, 8) == Decimal("0")


class TestFormatRestTime:
    def test_minutes_and_seconds(self):
        assert format_rest_time(90) == "1m 30s"

    def test_minutes_only(self):
        assert format_rest_time(120) == "2m"

    def test_seconds_only(self):
        assert format_rest_time(45) == "45s"

    def test_none(self):
        assert format_rest_time(None) == ""

    def test_zero(self):
        assert format_rest_time(0) == ""

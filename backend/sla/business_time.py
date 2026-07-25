from datetime import datetime, timedelta, time

WORK_START = time(9, 0)
WORK_END = time(18, 0)
WORK_DAYS = {0, 1, 2, 3, 4}  # lundi-vendredi


def add_business_hours(start: datetime, hours) -> datetime:
    remaining = timedelta(hours=float(hours))
    current = _next_working_moment(start)

    while remaining > timedelta(0):
        day_end = datetime.combine(current.date(), WORK_END, tzinfo=current.tzinfo)
        available_today = day_end - current

        if available_today <= timedelta(0):
            current = _next_working_moment(
                datetime.combine(current.date() + timedelta(days=1), WORK_START, tzinfo=current.tzinfo)
            )
            continue

        if remaining <= available_today:
            current = current + remaining
            remaining = timedelta(0)
        else:
            remaining -= available_today
            current = _next_working_moment(
                datetime.combine(current.date() + timedelta(days=1), WORK_START, tzinfo=current.tzinfo)
            )

    return current


def _next_working_moment(dt: datetime) -> datetime:
    while dt.weekday() not in WORK_DAYS:
        dt = datetime.combine(dt.date() + timedelta(days=1), WORK_START, tzinfo=dt.tzinfo)

    if dt.time() < WORK_START:
        dt = datetime.combine(dt.date(), WORK_START, tzinfo=dt.tzinfo)
    elif dt.time() >= WORK_END:
        dt = datetime.combine(dt.date() + timedelta(days=1), WORK_START, tzinfo=dt.tzinfo)
        return _next_working_moment(dt)

    return dt
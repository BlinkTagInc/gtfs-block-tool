/*
 * Format a calendar's list of days for display using abbreviated day names.
 */
const days = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];
export function formatDays(calendar) {
  const daysShort = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  let daysInARow = 0;
  let dayString = '';

  if (!calendar) {
    return '';
  }

  for (let i = 0; i <= 6; i += 1) {
    const currentDayOperating = calendar[days[i]] === 1;
    const previousDayOperating = i > 0 ? calendar[days[i - 1]] === 1 : false;
    const nextDayOperating = i < 6 ? calendar[days[i + 1]] === 1 : false;

    if (currentDayOperating) {
      if (dayString.length > 0) {
        if (!previousDayOperating) {
          dayString += ', ';
        } else if (daysInARow === 1) {
          dayString += '-';
        }
      }

      daysInARow += 1;

      if (
        dayString.length === 0 ||
        !nextDayOperating ||
        i === 6 ||
        !previousDayOperating
      ) {
        dayString += daysShort[i];
      }
    } else {
      daysInARow = 0;
    }
  }

  if (dayString.length === 0) {
    dayString = 'No regular service days';
  }

  return dayString;
}

const dateTimeRangePicker = (() => {

    let current_date = new Date();
    const 
        days_of_week = ["P", "U", "S", "C", "P", "S", "N"],
        months_of_year = [
            "Sijecanj", "Veljača", "Ožujak", "Travanj",
            "Svibanj", "Lipanj", "Srpanj", "Kolovoz",
            "Rujan", "Listopad", "Studeni", "Prosinac"
        ];

    const init = (data, input) => {
        // Parse the current date or datetime from the input field
        const inputValue = input.value.trim();
        if (inputValue) {
            const parsedDate = new Date(inputValue);
            if (!isNaN(parsedDate)) {
                current_date = parsedDate;
            }
        }

        const pickerElement = document.createElement("div");
        pickerElement.className = "datetimerange-picker";
        document.body.appendChild(pickerElement);

        const mode = input.getAttribute('data-mode');
        const numberOfMonths = parseInt(input.getAttribute('data-number-of-months')) || 1;

        const showTimer = (mode === 'datetime' || mode === 'datetimerange');

        render(pickerElement, input, mode, numberOfMonths, showTimer);
        positionPicker(pickerElement, input);
    };

    const render = (pickerElement, inputElement, mode, numberOfMonths, showTimer) => {
        pickerElement.innerHTML = '';
    
        for (let m = 0; m < numberOfMonths; m++) {
            const pickerWrapper = document.createElement("div");
            
            renderYearPicker(pickerWrapper, inputElement, m);    
            renderMonthPicker(pickerWrapper, inputElement, m);
            renderDayPicker(pickerWrapper, inputElement, m);
            if (showTimer) {
                renderTimePicker(pickerWrapper, m, inputElement, pickerElement);
            }
            pickerElement.appendChild(pickerWrapper);
        }
    };
    
    const renderYearPicker = (pickerWrapper, inputElement, monthOffset) => {
        const yearMonthPicker = document.createElement("div");
        yearMonthPicker.className = "year-month-picker";
    
        const year = getYear(monthOffset);
        let years = document.createElement("select");
        years.name = "years";
        yearMonthPicker.appendChild(years);
    
        for (let i = year - 3; i <= year + 3; i++) {
            let option = document.createElement("OPTION");
            option.value = i;
            option.text = i;
            if (i == year) option.selected = true;
            years.appendChild(option);
        }
    
        years.addEventListener("change", function () {
            updateYear(inputElement, monthOffset, this.value);
            renderDayPicker(pickerWrapper, inputElement, monthOffset);
            updateInputValue(inputElement, pickerWrapper.parentNode);
        });
    
        pickerWrapper.appendChild(yearMonthPicker);
    };
        
    const renderMonthPicker = (pickerWrapper, inputElement, monthOffset) => {
        const yearMonthPicker = pickerWrapper.querySelector('.year-month-picker');
    
        const month = getMonth(monthOffset);
        let months = document.createElement("select");
        months.name = "months";
        yearMonthPicker.appendChild(months);
    
        for (let j = 0; j < months_of_year.length; j++) {
            let option = document.createElement("OPTION");
            option.value = j + 1;
            option.text = months_of_year[j];
            if (j == month - 1) option.selected = true;
            months.appendChild(option);
        }
    
        months.addEventListener("change", function () {
            updateMonth(inputElement, monthOffset, this.value);
            renderDayPicker(pickerWrapper, inputElement, monthOffset);
            updateInputValue(inputElement, pickerWrapper.parentNode);
        });
    };

    const renderDayPicker = (pickerWrapper, inputElement, monthOffset) => {
        const datePicker = pickerWrapper.querySelector('.date-picker');
        if (datePicker) {
            datePicker.remove();
        }
    
        const newDatePicker = document.createElement("div");
        newDatePicker.className = "date-picker";
        const ul = document.createElement("ul");
    
        days_of_week.forEach(day => {
            const li = document.createElement("LI");
            li.innerHTML = day;
            ul.appendChild(li);
        });
    
        const { days_in_month, day_of_week } = getMonthDetails(monthOffset, inputElement);
    
        for (let i = -day_of_week + 1; i <= days_in_month; i++) {
            const li = document.createElement("LI");
            const css = [];
    
            if (i > 0) {
                const day = getDay(monthOffset, inputElement);
                if (i === day) {
                    css.push("current");
                }
                if (isToday(i, monthOffset, inputElement)) {
                    css.push("today");
                }
    
                const a = document.createElement("A");
                a.href = "#";
                a.innerHTML = i;
                li.className = css.join(" ");
                li.appendChild(a);
    
                a.addEventListener('click', (e) => {
                    e.preventDefault();
                    console.log(`Clicked day: ${i}, monthOffset: ${monthOffset}`);
                    updateInputValue(inputElement, pickerWrapper.parentNode, monthOffset, i);
                    pickerWrapper.parentNode.style.display = "none";
                });
    
            } else {
                li.innerHTML = "&nbsp;";
            }
    
            ul.appendChild(li);
        }
    
        newDatePicker.appendChild(ul);
        pickerWrapper.appendChild(newDatePicker);
    };    
    
    const renderTimePicker = (pickerWrapper, monthOffset, inputElement, pickerElement) => {
        const timePicker = document.createElement("div");
        timePicker.className = "time-picker";
        const timeFormat = inputElement.getAttribute('data-time-format') || 'military';
        
        const currentHours = current_date.getHours();
        const currentMinutes = current_date.getMinutes();
        const currentSeconds = current_date.getSeconds();
        
        let inputTimeout = null;
    
        ["hours", "minutes", "seconds"].forEach((unit, index) => {
            const timePickerUnit = document.createElement("div");
    
            const input = document.createElement("input");
            input.type = "text";
            input.name = `${unit}-${monthOffset}`;
            
            // Set the default value based on the current time
            if (unit === 'hours') {
                input.value = timeFormat === 'military' ? String(currentHours).padStart(2, '0') :
                    String(currentHours % 12 || 12).padStart(2, '0');
            } else if (unit === 'minutes') {
                input.value = String(currentMinutes).padStart(2, '0');
            } else if (unit === 'seconds') {
                input.value = String(currentSeconds).padStart(2, '0');
            }
            
            input.maxLength = 2;
    
            input.addEventListener('focus', (e) => {
                input.select();
            });
    
            input.addEventListener('keyup', (e) => {
                clearTimeout(inputTimeout);    
                input.value = input.value.replace(/[^0-9]/g, '');
                
                let value = parseInt(input.value, 10) || 0;
                if (unit === 'hours') {
                    if (timeFormat === 'military') {
                        if (value > 23) value = 23;
                    } else {
                        if (value < 1) value = 1;
                        if (value > 12) value = 12;
                    }
                } else if (unit === 'minutes' || unit === 'seconds') {
                    if (value > 59) value = 59;
                }
    
                inputTimeout = setTimeout(() => {
                    input.value = String(value).padStart(2, '0');
                    updateInputValue(inputElement, pickerElement);
                }, 500);
            });
    
            timePickerUnit.appendChild(input);
    
            const arrowContainer = document.createElement("div");
    
            const upArrow = document.createElement("button");
            upArrow.className = "up-arrow";
            upArrow.addEventListener("click", () => {
                increment(input, inputElement, pickerElement);
            });
            arrowContainer.appendChild(upArrow);
    
            const downArrow = document.createElement("button");
            downArrow.className = "down-arrow";
            downArrow.addEventListener("click", () => {
                decrement(input, inputElement, pickerElement);
            });
            arrowContainer.appendChild(downArrow);
    
            timePickerUnit.appendChild(arrowContainer);
            timePicker.appendChild(timePickerUnit);
        });
    
        if (timeFormat === 'standard') {
            const amPmPickerUnit = document.createElement("div");
            
            const amPmSelect = document.createElement("select");
            amPmSelect.name = `ampm-${monthOffset}`;
            
            ["AM", "PM"].forEach(period => {
                const option = document.createElement("option");
                option.value = period;
                option.text = period;
                amPmSelect.appendChild(option);
            });
            
            // Set the default AM/PM based on the current time
            amPmSelect.value = currentHours >= 12 ? 'PM' : 'AM';
    
            amPmSelect.addEventListener('change', () => {
                updateInputValue(inputElement, pickerElement);
            });
    
            amPmPickerUnit.appendChild(amPmSelect);
            timePicker.appendChild(amPmPickerUnit);
        }
    
        pickerWrapper.appendChild(timePicker);
    };
                        
    const increment = (input, inputElement, pickerElement) => {
        let value = parseInt(input.value, 10);
        const timeFormat = inputElement.getAttribute('data-time-format') || 'military';
    
        if (input.name.includes('hours')) {
            if (timeFormat === 'military') {
                if (value < 23) {
                    value++;
                } else {
                    value = 0;
                }
            } else {
                if (value < 12) {
                    value++;
                } else {
                    value = 1;
                }
            }
        } else if ((input.name.includes('minutes') || input.name.includes('seconds')) && value < 59) {
            value++;
        } else if (value === 59 && (input.name.includes('minutes') || input.name.includes('seconds'))) {
            value = 0; 
        }
    
        input.value = String(value).padStart(2, '0');
        updateInputValue(inputElement, pickerElement);
    };    

    const decrement = (input, inputElement, pickerElement) => {
        let value = parseInt(input.value, 10);
        const timeFormat = inputElement.getAttribute('data-time-format') || 'military';
    
        if (input.name.includes('hours')) {
            if (timeFormat === 'military') {
                if (value > 0) {
                    value--;
                } else {
                    value = 23;
                }
            } else {
                if (value > 1) {
                    value--;
                } else {
                    value = 12;
                }
            }
        } else if ((input.name.includes('minutes') || input.name.includes('seconds')) && value > 0) {
            value--;
        } else if (value === 0 && (input.name.includes('minutes') || input.name.includes('seconds'))) {
            value = 59;
        }
    
        input.value = String(value).padStart(2, '0');
        updateInputValue(inputElement, pickerElement);
    };    

    const updateInputValue = (inputElement, pickerElement, monthOffset, selectedDay) => {
        const allDatePickers = pickerElement.querySelectorAll('.date-picker');
        let fullDateTime = [];
    
        const locale = inputElement.getAttribute('data-locale') || navigator.language;
        const timeFormat = inputElement.getAttribute('data-time-format') || 'military';
    
        allDatePickers.forEach((datePicker, index) => {
            const selectedYear = datePicker.parentElement.querySelector('select[name="years"]').value;
            const selectedMonth = datePicker.parentElement.querySelector('select[name="months"]').value.padStart(2, '0');
            const dayElement = selectedDay || datePicker.querySelector('li.current a')?.innerText.padStart(2, '0');
            const day = dayElement ? String(dayElement).padStart(2, '0') : '01';
    
            let dateValue = `${selectedYear}-${selectedMonth}-${day}`;
    
            if (inputElement.getAttribute('data-mode') === 'datetime' || inputElement.getAttribute('data-mode') === 'datetimerange') {
                const timeInputs = datePicker.parentElement.querySelectorAll('.time-picker input[type="text"]');
                let timeValues = [];
    
                timeInputs.forEach(input => {
                    timeValues.push(input.value.padStart(2, '0'));
                });
    
                let timeString = timeValues.join(':');
    
                if (timeFormat === 'standard') {
                    const amPm = datePicker.parentElement.querySelector(`select[name="ampm-${index}"]`).value;
                    timeString += ` ${amPm}`;
                }
    
                dateValue += ` ${timeString}`;
            }
    
            fullDateTime.push(dateValue);
    
            const dateObj = new Date(dateValue);
            const formattedDate = new Intl.DateTimeFormat(locale, {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: timeFormat === 'standard'
            }).format(dateObj);
    
            const isoDate = dateObj.toISOString();
    
            console.log(`Formatted DateTime [${locale}]: ${formattedDate}`);
            console.log(`ISO Format: ${isoDate}`);
        });
    
        if (inputElement.getAttribute('data-mode') === 'daterange' || inputElement.getAttribute('data-mode') === 'datetimerange') {
            inputElement.value = fullDateTime.join(' - ');
        } else if (fullDateTime.length > 0) {
            inputElement.value = fullDateTime[0];
        }
    };
        
    const getMonthDetails = (monthOffset, inputElement) => {
        const month = getMonth(monthOffset);
        const year = getYear(monthOffset);

        return {
            days_in_month: get_days_in_month(month - 1, year),
            day_of_week: get_day_of_week(month - 1, year)
        };
    };

    const isToday = (day, monthOffset, inputElement) => {
        const currentDate = new Date();
        const year = getYear(monthOffset);
        const month = getMonth(monthOffset);
        return day === currentDate.getDate() && month === currentDate.getMonth() + 1 && year === currentDate.getFullYear();
    };

    const getDay = (monthOffset, inputElement) => {
        const newDate = new Date(current_date);
        newDate.setMonth(current_date.getMonth() + monthOffset);
        return newDate.getDate();
    };    

    const getYear = (monthOffset) => {
        const newDate = new Date(current_date);
        newDate.setMonth(current_date.getMonth() + monthOffset);
        return newDate.getFullYear();
    };

    const getMonth = (monthOffset) => {
        const newDate = new Date(current_date);
        newDate.setMonth(current_date.getMonth() + monthOffset);
        return newDate.getMonth() + 1;
    };

    const updateYear = (inputElement, monthOffset, newYear) => {
        const newDate = new Date(current_date);
        newDate.setFullYear(newYear);
        current_date.setFullYear(newDate.getFullYear());
    };

    const updateMonth = (inputElement, monthOffset, newMonth) => {
        const newDate = new Date(current_date);
        newDate.setMonth(newMonth - 1);
        current_date.setMonth(newDate.getMonth());
    };

    const positionPicker = (pickerElement, inputElement) => {
        inputElement.addEventListener('focus', function () {
            const rect = inputElement.getBoundingClientRect();
            pickerElement.style.top = `${rect.bottom + window.scrollY}px`;
            pickerElement.style.left = `${rect.left + window.scrollX}px`;
            pickerElement.style.display = "flex";
        });

        document.addEventListener('click', function (event) {
            if (!pickerElement.contains(event.target) && event.target !== inputElement) {
                pickerElement.style.display = "none";
            }
        });
    };

    const get_day_of_week = (month, year) => {
        const firstDay = new Date(year, month, 1);
        return (firstDay.getDay() + 6) % 7;
    };

    const get_days_in_month = (month, year) => {
        if (month === 1) {
            return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0) ? 29 : 28;
        } else {
            return (month % 7) % 2 !== 0 ? 30 : 31;
        }
    };

    return {
        init: init
    };

})();

document.addEventListener('DOMContentLoaded', () => {
    const calendarInputs = document.querySelectorAll('.datetimerange');
    calendarInputs.forEach(inputElement => {
        dateTimeRangePicker.init({}, inputElement);
    });
});

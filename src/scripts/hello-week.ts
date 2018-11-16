import '../styles/hello-week.scss';
import {CSS_CLASSES, DAYS_WEEK} from './constants';

type CallbackFunction = (...args: any[]) => void;

export class HelloWeek {
    private options: any;
    private selector: any;
    private datepicker: any = {};
    private days: any = null;
    private date: any;
    private today: any;
    private minDate: any;
    private maxDate: any;
    private defaultDate: any;
    private langs: any;
    private interval: any = [];
    private lastSelectedDay: string;
    private selectedDates: any = [];
    private selectedTemporary: any = [];

    /* @return enum {CSS_CLASSES} */
    static get CSS_CLASSES() {
        return CSS_CLASSES;
    }

    /* @return enum {DAYS_WEEK} */
    static get DAYS_WEEK() {
        return DAYS_WEEK;
    }

    constructor (options: any = {}) {
        this.options = HelloWeek.extend(options);
        this.selector = typeof this.options.selector === 'string' ? document.querySelector(this.options.selector) : this.options.selector;

        // early throw if selector doesn't exists
        if (this.selector === null) {
            throw new Error('You need to specify a selector!');
        }

        this.datepicker.header = this.__creatHTMLElement(HelloWeek.CSS_CLASSES.HEADER, this.selector);
        if (this.options.nav) {
            this.datepicker.prevMonth = this.__creatHTMLElement(HelloWeek.CSS_CLASSES.PREV, this.datepicker.header, this.options.nav[0]);
            this.datepicker.period = this.__creatHTMLElement(HelloWeek.CSS_CLASSES.LABEL, this.datepicker.header);
            this.datepicker.nextMonth = this.__creatHTMLElement(HelloWeek.CSS_CLASSES.NEXT, this.datepicker.header, this.options.nav[1]);
            this.datepicker.prevMonth.addEventListener('click', () => { this.prev( () => { /** callback function */ } ); });
            this.datepicker.nextMonth.addEventListener('click', () => { this.next( () => { /** callback function */ } ); });
        } else {
            this.datepicker.period = this.__creatHTMLElement(HelloWeek.CSS_CLASSES.LABEL, this.datepicker.header);
        }

        this.datepicker.week = this.__creatHTMLElement(HelloWeek.CSS_CLASSES.WEEK, this.selector);
        this.datepicker.month = this.__creatHTMLElement(HelloWeek.CSS_CLASSES.MONTH, this.selector);

        this.__readFile(this.options.langFolder + this.options.lang + '.json', (text: any) => {
            this.langs = JSON.parse(text);
            this.init(() => { /** callback function */ });
        });
    }

    public destroy(): void {
        this.__removeActiveClass();
    }

    /**
     * @param {CallbackFunction} callback
     * @public
     */
    public init(callback: CallbackFunction) {
        this.today = new Date();
        this.date = new Date();
        this.defaultDate = new Date();
        if (this.options.defaultDate) {
            this.date = new Date(this.options.defaultDate);
            this.defaultDate = new Date(this.options.defaultDate);
            this.defaultDate.setDate(this.defaultDate.getDate());
        }
        this.date.setDate(1);

        if (this.options.minDate) {
            this.minDate = new Date(this.options.minDate);
            this.minDate.setHours(0,0,0,0);
            this.minDate.setDate(this.minDate.getDate() - 1);
        }

        if (this.options.maxDate) {
            this.maxDate = new Date(this.options.maxDate);
            this.maxDate.setHours(0,0,0,0);
            this.maxDate.setDate(this.maxDate.getDate() + 1);
        }

        this.__updted();
        this.options.onLoad.call(this);
        if (callback) {
            callback.call(this);
        }
    }

    /**
     * Method change the month to the previous, also you can send a callback function like a parameter.
     * @param {CallbackFunction} callback
     * @public
     */
    public prev(callback: CallbackFunction): void {
        const prevMonth = this.date.getMonth() - 1;
        this.__clearCalendar();
        this.date.setMonth(prevMonth);
        this.__updted();

        this.options.onChange.call(this);
        if (callback) {
            callback.call(this);
        }
    }

    /**
     * Method change the month to the next, also you can send a callback function like a parameter.
     * @param {CallbackFunction} callback
     * @public
     */
    public next(callback: CallbackFunction): void {
        this.__clearCalendar();
        const nextMonth = this.date.getMonth() + 1;
        this.date.setMonth(nextMonth);
        this.__updted();

        this.options.onChange.call(this);
        if (callback) {
            callback.call(this);
        }
    }

    /**
     * Returns the current day with the format specified.
     * Returns timestamps otherwise.
     * @param  {boolean} formated
     * @return {string}
     * @public
     */
    public getSelectedDates(): string {
        return this.selectedDates;
    }

    /**
     * Method move the calendar to current day.
     * @public
     */
    public goToday(): void {
        this.__clearCalendar();
        this.date = this.today;
        this.date.setDate(1);
        this.__updted();
    }

    /**
     * Method clean selected days in calendar.
     * @public
     */
    public clear(callback: CallbackFunction): void {
        this.__clearCalendar();
        this.date.setDate(1);
        this.selectedDates = [];
        this.selectedTemporary = [];
        this.__updted();

        this.options.onClear.call(this);
        if (callback) {
            callback.call(this);
        }
    }

    public setRange(): void {
        this.options.range = !this.options.range;
    }

    /**
     * Select day
     * @param {CallbackFunction} callback
     * @private
     */
    private __selectDay(callback: CallbackFunction): void {
        this.days = this.selector.querySelectorAll('.' + HelloWeek.CSS_CLASSES.MONTH + ' .' + HelloWeek.CSS_CLASSES.DAY);
        for (const i of Object.keys(this.days)) {
            this.__handleClickInteraction(this.days[i], callback);

            if (this.options.range) {
                this.__handleMouseInteraction(this.days[i]);
            }
        }
    }

    /**
     * @param {HTMLElement} selectDay
     * @private
     */
    private __setRangeDays(selectDay: HTMLElement) {
        if (this.interval.length === 2) {
            this.interval = [];
            this.selectedDates = [];
            this.selectedTemporary = [];
            this.interval.push(selectDay);
            this.__removeActiveClass();
            selectDay.classList.add(HelloWeek.CSS_CLASSES.IS_SELECTED);
        } else {
            if (this.interval[0] && selectDay.dataset.timestamp < this.interval[0].dataset.timestamp) {
                selectDay.classList.remove(HelloWeek.CSS_CLASSES.IS_SELECTED);
                return;
            }
            this.interval.push(selectDay);
            if (this.interval.length > 1) {
                this.interval[1].classList.add(HelloWeek.CSS_CLASSES.IS_SELECTED);
            }
        }
    }

    /**
     * @param {HTMLElement} target
     * @param {CallbackFunction} callback
     * @private
     */
    private __handleClickInteraction(target: HTMLElement, callback: CallbackFunction): void {
        target.addEventListener('click', (event: any) => {
            const selectDay = event.target;

            if (selectDay.classList.contains(HelloWeek.CSS_CLASSES.IS_DISABLED)) {
                return;
            }

            this.lastSelectedDay = this.options.format ? this.__formatDate(parseInt(selectDay.dataset.timestamp) * 1000, this.options.format) : selectDay.dataset.timestamp;

            if (!this.options.range) {
                if (this.options.multiplePick) {
                    this.selectedDates.push(this.lastSelectedDay);
                    if (selectDay.classList.contains(HelloWeek.CSS_CLASSES.IS_SELECTED)) {
                        this.selectedDates = this.selectedDates.filter((day: string) => day !== this.lastSelectedDay);
                        this.selectedTemporary = this.selectedTemporary.filter((day: string) => day !== this.lastSelectedDay);
                    }
                } else {
                    if (!selectDay.classList.contains(HelloWeek.CSS_CLASSES.IS_DISABLED)) {
                        this.__removeActiveClass();
                    }
                    this.selectedDates = [];
                    this.selectedTemporary = [];
                    this.selectedDates.push(this.lastSelectedDay);
                    this.selectedTemporary.push(this.lastSelectedDay);
                }
            }

            if (!selectDay.classList.contains(HelloWeek.CSS_CLASSES.IS_DISABLED)) {
                selectDay.classList.toggle(HelloWeek.CSS_CLASSES.IS_SELECTED);
            }

            if (this.options.range) {
                this.__setRangeDays(selectDay);
            }

            this.options.onSelect.call(this);
            if (callback) {
                callback.call(this);
            }
        });
    }

    private __handleMouseInteraction(target: HTMLElement): void {
        target.addEventListener('mouseover', (event: any) => {
            if ((this.interval.length > 1) || this.interval[0] && event.target.dataset.timestamp < this.interval[0].dataset.timestamp) {
                return;
            }

            if (this.interval.length > 0 && this.interval.length < 2) {
                this.selectedDates = [];
                let element = this.interval[0];
                for (const elm of this.selector.querySelectorAll('.' + HelloWeek.CSS_CLASSES.IS_SELECTED)) {
                    if(!this.interval.includes(elm)) {
                        (<HTMLElement>elm).classList.remove(HelloWeek.CSS_CLASSES.IS_SELECTED);
                    }
                }
                this.selectedDates.push(this.options.format ? this.__formatDate(parseInt(element.dataset.timestamp) * 1000, this.options.format) : element.dataset.timestamp);
                while(element.nextElementSibling && element !== event.target) {
                    element = element.nextElementSibling;
                    if (!element.classList.contains(HelloWeek.CSS_CLASSES.IS_DISABLED)) {
                        this.selectedDates.push(this.options.format ?
                            this.__formatDate(parseInt(element.dataset.timestamp) * 1000, this.options.format) : element.dataset.timestamp);
                        element.classList.add(HelloWeek.CSS_CLASSES.IS_SELECTED);
                        // temporary array with selected days
                        this.selectedTemporary.push(this.options.format ?
                            this.__formatDate(parseInt(element.dataset.timestamp) * 1000, this.options.format) : element.dataset.timestamp);
                    }
                }
            }
        });
    }

    /**
     * @param      {number}  dayShort
     * @private
     */
    private __creatWeek(dayShort: number): void {
        const weekDay = <any>document.createElement('span');
        weekDay.classList.add(HelloWeek.CSS_CLASSES.DAY);
        weekDay.textContent = dayShort;
        this.datepicker.week.appendChild(weekDay);
    }

    /**
     * @private
     */
    private __createMonth(): void {
        const currentMonth = this.date.getMonth();
        while (this.date.getMonth() === currentMonth) {
            this.__createDay(this.date.getDate(), this.date.getDay());
            this.date.setDate(this.date.getDate() + 1);
        }

        this.date.setMonth(this.date.getMonth() - 1);
        this.__selectDay(() => { /** callback function */ });
    }

    /**
     * Create days inside hello-week
     * @param {number} num
     * @param {number} day
     * @private
     */
    private __createDay (num: number, day: number): void {
        const unixTimestamp = new Date(this.date).setHours(0,0,0,0);
        const timestamp = unixTimestamp / 1000;
        const newDay = <any>document.createElement('div');

        newDay.textContent = num;
        newDay.classList.add(HelloWeek.CSS_CLASSES.DAY);
        newDay.setAttribute('data-timestamp', timestamp);

        if (num === 1) {
            if (this.options.weekStart === HelloWeek.DAYS_WEEK.SUNDAY) {
                newDay.style.marginLeft = ((day) * (100 / 7)) + '%';
            } else {
                if (day === HelloWeek.DAYS_WEEK.SUNDAY) {
                    newDay.style.marginLeft = ((7 - this.options.weekStart) * (100 / 7)) + '%';
                } else {
                    newDay.style.marginLeft = ((day - 1) * (100 / 7)) + '%';
                }
            }
        }

        if (day === HelloWeek.DAYS_WEEK.SUNDAY || day === HelloWeek.DAYS_WEEK.SATURDAY) {
            newDay.classList.add(HelloWeek.CSS_CLASSES.IS_WEEKEND);
        }

        if (this.options.disabledDaysOfWeek && this.options.disabledDaysOfWeek.includes(day)
            || this.options.disablePastDays && this.date.getTime() <= this.defaultDate.getTime() - 1
            || this.options.minDate && (this.minDate.getTime() >= unixTimestamp)
            || this.options.maxDate && (this.maxDate.getTime() <= unixTimestamp)) {
            newDay.classList.add(HelloWeek.CSS_CLASSES.IS_DISABLED);
        }


        if (this.options.disableDates) {
            this.__setDaysDisable(unixTimestamp, newDay);
        }

        // check if defaultDate exists so we set that defaultDate marked with the same style as today.
        if (this.today.setHours(0,0,0,0) === new Date(unixTimestamp).setHours(0,0,0,0)) {
            newDay.classList.add(HelloWeek.CSS_CLASSES.IS_TODAY);
        }

        if (this.options.format) {
            this.selectedDates.find( (day: string) => {
                if (day === this.__formatDate(unixTimestamp, this.options.format)) {
                    newDay.classList.toggle(HelloWeek.CSS_CLASSES.IS_SELECTED);
                }
            });
        } else {
            this.selectedDates.find( (day: number) => {
                if (day === timestamp) {
                    newDay.classList.toggle(HelloWeek.CSS_CLASSES.IS_SELECTED);
                }
            });
        }

        if (this.options.daysHighlight) {
            this.__setDaysHighlight(unixTimestamp, newDay);
        }

        if (this.datepicker.month) {
            this.datepicker.month.appendChild(newDay);
        }

        if (this.selectedTemporary.length > 0 && num === 1) {
            this.interval[0] = newDay;
        }
    }

    /**
     * Sets the days disable.
     * @param      {number}  unixTimestamp
     * @param      {HTMLElement}  newDay
     * @private
     */
    private __setDaysDisable(unixTimestamp: number, newDay: HTMLElement): void {
        if (this.options.disableDates[0] instanceof Array) {
            this.options.disableDates.map((date: any) => {
                if (unixTimestamp >= new Date(new Date(date[0]).setHours(0,0,0,0)).getTime() &&
                        unixTimestamp <= new Date(new Date(date[1]).setHours(0,0,0,0)).getTime()) {
                    newDay.classList.add(HelloWeek.CSS_CLASSES.IS_DISABLED);
                }
            });
        } else {
            this.options.disableDates.map((date: any) => {
                if (new Date(new Date(unixTimestamp).setHours(0,0,0,0)).getTime() === new Date(new Date(date).setHours(0,0,0,0)).getTime()) {
                    newDay.classList.add(HelloWeek.CSS_CLASSES.IS_DISABLED);
                }
            });
        }
    }

    /**
     * Sets the days highlight.
     * @param      {number}  unixTimestamp
     * @param      {HTMLElement}  newDay
     * @private
     */
    private __setDaysHighlight(unixTimestamp: number, newDay: HTMLElement): void {
        if (newDay.classList.contains(HelloWeek.CSS_CLASSES.IS_DISABLED)) {
            return;
        }
        for (const key in this.options.daysHighlight) {
            if (this.options.daysHighlight[key].days[0] instanceof Array) {
                this.options.daysHighlight[key].days.map((date: any, index: number) => {
                    if (unixTimestamp >= new Date(new Date(date[0]).setHours(0,0,0,0)).getTime() && unixTimestamp <= new Date(new Date(date[1]).setHours(0,0,0,0)).getTime()) {
                        newDay.classList.add(HelloWeek.CSS_CLASSES.IS_HIGHLIGHT);
                        if (this.options.daysHighlight[key].title) {
                            newDay.setAttribute('data-title', this.options.daysHighlight[key].title);
                        }
                        if (this.options.daysHighlight[key].color) {
                            newDay.style.color = this.options.daysHighlight[key].color;
                        }
                        if (this.options.daysHighlight[key].backgroundColor) {
                            newDay.style.backgroundColor = this.options.daysHighlight[key].backgroundColor;
                        }
                    }
                });
            } else {
                this.options.daysHighlight[key].days.map((date: any) => {
                    if (new Date(new Date(unixTimestamp).setHours(0,0,0,0)).getTime() === new Date(new Date(date).setHours(0,0,0,0)).getTime()) {
                        newDay.classList.add(HelloWeek.CSS_CLASSES.IS_HIGHLIGHT);
                        if (this.options.daysHighlight[key].title) {
                            newDay.setAttribute('data-title', this.options.daysHighlight[key].title);
                        }
                        if (this.options.daysHighlight[key].color) {
                            newDay.style.color = this.options.daysHighlight[key].color;
                        }
                        if (this.options.daysHighlight[key].backgroundColor) {
                            newDay.style.backgroundColor = this.options.daysHighlight[key].backgroundColor;
                        }
                    }
                });
            }
        }
    }

    /**
     * @param      {number}  monthIndex
     * @return     {object}
     * @private
     */
    private __monthsAsString(monthIndex: number): any {
        return this.options.monthShort ? this.langs.monthsShort[monthIndex] : this.langs.months[monthIndex];
    }

    /**
     * @param      {number}  weekIndex
     * @return     {object}
     * @private
     */
    private __weekAsString(weekIndex: number): any {
        return this.options.weekShort ? this.langs.daysShort[weekIndex] : this.langs.days[weekIndex];
    }

    /**
     * @private
     */
    private __updted(): void {
        const listDays: number[] = [];
        if (this.datepicker.period) {
            this.datepicker.period.innerHTML = this.__monthsAsString(this.date.getMonth()) + ' ' + this.date.getFullYear();
        }
        /** Define week format */
        this.datepicker.week.textContent = '';
        for (let i = this.options.weekStart; i < this.langs.daysShort.length; i++) {
            listDays.push(i);
        }

        for (let i = 0; i < this.options.weekStart; i++) {
            listDays.push(i);
        }

        for (const day of listDays) {
            this.__creatWeek(this.__weekAsString(day));
        }

        this.__createMonth();
    }

    /**
     * @private
     */
    private __clearCalendar(): void {
        this.datepicker.month.textContent = '';
    }

    /**
     * Removes an active class.
     * @private
     */
    private __removeActiveClass(): void {
        for (const i of Object.keys(this.days)) {
            this.days[i].classList.remove(HelloWeek.CSS_CLASSES.IS_SELECTED);
        }
    }

    /**
     * Reads a file.
     * @param      {string}    file
     * @param      {Function}  callback
     * @private
     */
    private __readFile(file: string, callback: CallbackFunction): void {
         const xobj = new XMLHttpRequest();
         xobj.overrideMimeType('application/json');
         xobj.open('GET', file, true);
         xobj.onreadystatechange = () => {
             if (xobj.readyState === 4 && <any>xobj.status === 200) {
                 callback(xobj.responseText);
             }
         };
         xobj.send(null);
    }

    /**
     * Format Date
     * @param      {number}  timestamp
     * @param      {string}  format
     * @return     {string}
     * @private
     */
    public __formatDate(timestamp: number, format: string): string {
        const dt = new Date(timestamp);
        format = format.replace('dd', dt.getDate().toString());
        format = format.replace('DD', (dt.getDate() > 9 ? dt.getDate() : '0' + dt.getDate()).toString());
        format = format.replace('mm', (dt.getMonth() + 1).toString());
        format = format.replace('MMM', this.langs.months[dt.getMonth()]);
        format = format.replace('MM', ((dt.getMonth() + 1) > 9 ? (dt.getMonth() + 1) : '0' + (dt.getMonth() + 1)).toString());
        format = format.replace('mmm', this.langs.monthsShort[dt.getMonth()]);
        format = format.replace('yyyy', dt.getFullYear().toString());
        format = format.replace('YYYY', dt.getFullYear().toString());
        format = format.replace('YY', (dt.getFullYear().toString()).substring(2));
        format = format.replace('yy', (dt.getFullYear().toString()).substring(2));
        return format;
    }

    /**
     * Create HTML elements for Hello Week.
     * @param {string}      className
     * @param {HTMLElement} parentElement
     * @param {string} textNode
     * @private
     */
    private __creatHTMLElement(className: string, parentElement: HTMLElement, textNode: string = null) {
        let elem = this.selector.querySelector('.' + className);
        if (!elem) {
            elem = document.createElement('div');
            elem.classList.add(className);
            if (textNode !== null) {
                const text = document.createTextNode(textNode);
                (<HTMLElement>elem).appendChild(text);
            }
            (<HTMLElement>parentElement).appendChild(elem);
        }
        return elem;
    }

    private static extend(options: CallbackFunction): object {
        const settings: any = {
            selector: '.hello-week',
            lang: 'en',
            langFolder: './dist/langs/',
            format: 'dd/mm/yyyy',
            weekShort: true,
            monthShort: false,
            multiplePick: false,
            defaultDate: false,
            todayHighlight: true,
            disablePastDays: false,
            disabledDaysOfWeek: false,
            disableDates: false,
            weekStart: 0,
            daysHighlight: false,
            range: false,
            minDate: false,
            maxDate: false,
            nav: ['◀', '▶'],
            onLoad: () => { /** callback function */ },
            onChange: () => { /** callback function */ },
            onSelect: () => { /** callback function */ },
            onClear: () => { /** callback function */ },
        };

        const defaultSettings = <any>options;
        for (const i of Object.keys(defaultSettings)) {
            settings[i] = defaultSettings[i];
        }

        return settings;
    }
}

import { HelloWeek as MyHelloWeek } from './hello-week';
export namespace MyModule {
    export const HelloWeek = MyHelloWeek;
}

(<any>window).HelloWeek = MyModule.HelloWeek;

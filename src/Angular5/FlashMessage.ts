export class FlashMessage {
    /**
     * Properties of Flash
     */
    private $_element: any;
    private $_container: any;
    private $_progress: any;
    private _progress_value: any;
    private _progress_offset: any;
    private _progress_interval: any;
    private _c_timeout: any;
    private message: string;
    private type: string;
    private options: any;

    /*
     * Constantes
     */
    static get _CONSTANTS() {
        return {
            TYPES: {
                SUCCESS: 'success',
                WARNING: 'warning',
                ERROR: 'error',
                INFO: 'info',
            },
            THEME: 'default',
            CONTAINER: '.flash-container',
            CLASSES: {
                CONTAINER: 'flash-container',
                VISIBLE: 'is-visible',
                FLASH: 'flash-message',
                PROGRESS: 'flash-progress',
                PROGRESS_HIDDEN: 'is-hidden'
            },
        };
    }

    /**
     * Default options of flash
     */
    static get DEFAULT_OPTIONS() {
        return {
            progress: false,
            interactive: true,
            timeout: 8000,
            appear_delay: 200,
            remove_delay: 600,
            container: this._CONSTANTS.CONTAINER,
            classes: {
                container: this._CONSTANTS.CLASSES.CONTAINER,
                visible: this._CONSTANTS.CLASSES.VISIBLE,
                flash: this._CONSTANTS.CLASSES.FLASH,
                progress: this._CONSTANTS.CLASSES.PROGRESS,
                progress_hidden: this._CONSTANTS.CLASSES.PROGRESS_HIDDEN
            },
            theme: this._CONSTANTS.THEME,
            onShow: null,
            onClick: null,
            onClose: null,
        };
    }

    constructor(
        message,
        type = FlashMessage._CONSTANTS.TYPES.ERROR,
        options = {}
    ) {
        if (type.constructor === Object) {
            options = type;
            type = FlashMessage._CONSTANTS.TYPES.ERROR;
        }

        this.$_element = null;
        this.setOptions(options);

        if (message instanceof Element) {
            this.$_element = message;
            this._composeMessage();
        } else {
            this.message = message;
            this.type = type;
        }

        this.$_container = document.querySelector(this.options.container) || null;
        this._c_timeout = null;

        this.$_progress = null;
        this._progress_value = 0;
        this._progress_offset = 0;
        this._progress_interval = null;

        this._createContainer();
        this._createMessage();
    }

    /*
     * Creation methods
     * @return new FlashMessage
     */
    static create(message, type = FlashMessage._CONSTANTS.TYPES.ERROR, options = {}) {
        return new this(message, type, options);
    }
    static success(message, options = {}) {
        return new this(message, FlashMessage._CONSTANTS.TYPES.SUCCESS, options);
    }
    static warning(message, options = {}) {
        return new this(message, FlashMessage._CONSTANTS.TYPES.WARNING, options);
    }
    static error(message, options = {}) {
        return new this(message, FlashMessage._CONSTANTS.TYPES.ERROR, options);
    }
    static info(message, options = {}) {
        return new this(message, FlashMessage._CONSTANTS.TYPES.INFO, options);
    }

    static addCustomVerbs(...verbs) {
        if (!verbs || !verbs.length) {
            return;
        }
        verbs.forEach(verb => {
            if (!FlashMessage[verb]) {
                FlashMessage[verb] = (message, options = {}) => new FlashMessage(message, verb, options);
            }
        });
    }

    /**
     * Callables methodes
     */
    create(): void {
        console.log('FLASH CREEE');
        const div = document.createElement('div');
        div.className += 'flash';
        document.body.appendChild(div);
    }

    setOptions(options = {}) {
        this.options = Object.assign({}, FlashMessage.DEFAULT_OPTIONS, options);
        return this;
    }

    destroy() {
        this._close();
    }

    /**
     * private methods
     */
    private _createContainer() {
        if (this.$_container === null || !document.body.contains(this.$_container)) {
            this.$_container = document.createElement('div');
            this.$_container.classList.add(this.options.classes.container);
            if (document.body.firstChild) {
                document.body.insertBefore(this.$_container, document.body.firstChild);
            } else {
                document.body.appendChild(this.$_container);
            }
        }
    }

    private _composeMessage() {
        this.message = this.$_element.dataset.message || this.$_element.innerHTML || '';
        this.type = this.$_element.dataset.type || FlashMessage._CONSTANTS.TYPES.ERROR;
        if (this.$_element.dataset.progress !== undefined) {
            this.setOptions({ progress: true });
        }
        this.$_element.classList.add(`flash-${this.type}`);
    }

    private _createMessage() {
        if (!this.$_element) {
            this.$_element = document.createElement('div');
            this.$_element.classList.add(this.options.classes.flash, `flash-${this.type}`);
            this.$_element.setAttribute('data-type', this.type);
            this.$_element.setAttribute('data-message', this.message);
            this.$_element.innerHTML = this.message;

            if (this.options.thumb) {
                const thumb = document.createElement('img');
                thumb.classList.add('thumb');
                thumb.src = this.options.thumb;
                this.$_element.classList.add('has-thumb');
                this.$_element.appendChild(thumb);
            }

            this._append();
        } else {
            if (this.$_element.querySelector('.thumb')) {
                this.$_element.classList.add('has-thumb');
            }
        }

        this._setTheme();

        if (this._hasProgress()) {
            this._progressBar();
        }
        if (this.$_element.dataset.timeout) {
            this.options.timeout = parseInt(this.$_element.dataset.timeout, 10);
        }

        this._behavior();
        if (this._isInteractive() === true) {
            this._bindEvents();
        }
    }

    private _append() {
        this.$_container.appendChild(this.$_element);
    }

    private _behavior() {
        this._run();
        window.setTimeout(() => this.$_element.classList.add(this.options.classes.visible), this.options.appear_delay);
    }

    private _run() {
        this._startProgress();
        this._c_timeout = window.setTimeout(() => this._close(), this.options.timeout);
    }

    private _stop() {
        if (this._c_timeout !== null) {
            window.clearTimeout(this._c_timeout);
            this._stopProgress();
            this._c_timeout = null;
        }
    }

    private _close() {
        this._stopProgress();
        if (this._isInteractive()) {
            this._unbindEvents();
        }
        this.$_element.classList.remove(this.options.classes.visible);
        this.$_element.addEventListener('transitionend', () => {
            this.$_container.removeChild(this.$_element);
            this._clear();
        });
    }

    private _clear() {
        if (!this.$_container.children.length && this.$_container.parentNode.contains(this.$_container)) {
            this.$_container.parentNode.removeChild(this.$_container);
        }
    }


    private _bindEvents() {
        this._bindEvent('mouseover', _ => this._stop());
        this._bindEvent('mouseleave', _ => this._run());
        this._bindEvent('click', _ => this._close());

    }

    private _bindEvent(event_name, callback) {
        try {
            if (!this.$_element.addEventListener) {
                this.$_element.attachEvent(`on${this._getCapitalizedEventName(event_name)}`, callback);
            } else {
                this.$_element.addEventListener(event_name, callback, false);
            }
        } catch (err) {
            throw new Error(`FlashMessage._bindEvent - Cannot add event on element - ${err}`);
        }

    }

    private _unbindEvents() {
        this._unbindEvent('mouseover', _ => this._stop());
        this._unbindEvent('mouseleave', _ => this._run());
        this._unbindEvent('click', _ => this._close());
    }

    private _unbindEvent(event_name, callback) {
        try {
            if (!this.$_element.removeEventListener) {
                this.$_element.detachEvent(`on${this._getCapitalizedEventName(event_name)}`, callback);
            } else {
                this.$_element.removeEventListener(event_name, callback, false);
            }
        } catch (err) {
            throw new Error(`FlashMessage._unbindEvent - Cannot remove event on element - ${err}`);
        }
    }

    private _isInteractive() {
        return Boolean(this.options.interactive === true);
    }

    private _getCapitalizedEventName(event_name) {
        return event_name.charAt(0).toUpperCase() + event_name.substr(1);
    }

    private _hasProgress() {
        return Boolean(this.options.progress);
    }

    private _progressBar() {
        this.$_progress = document.createElement('div');
        this.$_progress.classList.add(this.options.classes.progress);
        this.$_element.appendChild(this.$_progress);
    }

    private _startProgress() {
        if (!this._hasProgress()) {
            return;
        }
        if (!this.$_progress) {
            this._progressBar();
        }
        this._stopProgress();
        this._progress_offset = 0;
        this.$_progress.classList.remove(this.options.classes.progress_hidden);
        this._progress_interval = window.setInterval(() => this._setProgress(), 16);
    }

    private _setProgress() {
        this.$_progress.style.width = `${this._progress_value}%`;
        this._progress_value = ((this._progress_offset * 100) / this.options.timeout).toFixed(2);
        this._progress_offset += 16;
        if (this._progress_value >= 100) {
            this._stopProgress();
        }
    }


    private _stopProgress() {
        if (!this._hasProgress() || !this.$_progress) {
            return;
        }
        this.$_progress.classList.add('is-hidden');
        window.clearInterval(this._progress_interval);
        this._progress_interval = null;
        this._progress_value = 0;
    }

    private _setTheme() {
        const theme = this.$_element.dataset.theme || this.options.theme || '';
        if (theme.length && theme !== FlashMessage._CONSTANTS.THEME) {
            this.$_element.classList.add(`${theme}-theme`);
        }
    }
}
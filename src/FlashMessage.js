'use strict'

import Flash from './Flash'

export default class FlashMessage {

    constructor (message, type = 'error', options = {}) {
        if (type.constructor === Object) {
            options = type
            type = 'error'
        }

        this.$_element = null

        if (message instanceof Element) {
            this.$_element = message
            this._composeMessage()
        } else {
            this.message = message
            this.type = type
        }

        this.options = Object.assign({}, FlashMessage.DEFAULT_OPTIONS, options)
        this.$_container = document.querySelector(this.options.container) || null
        this._c_timeout = null
        
        this.$_progress = null
        this._progress = 0
        this._interval = null

        this._createContainer()
        this._createMessage()
    }
    
    static get DEFAULT_OPTIONS () {
        return {
            progress: false,
            timeout: 8000,
            appear_delay: 200,
            remove_delay: 600,
            container: '.flash-container',
            classes: {
                container: 'flash-container',
                visible: 'is-visible',
                flash: 'flash-message',
                progress: 'flash-progress',
                progress_hidden: 'is-hidden'
            }
        }
    }

    static create (message, type = 'error', options = {}) {
        return new FlashMessage(message, type, options)
    }

    static success (message, options = {}) {
        return new FlashMessage(message, 'success', options)
    }

    static warning (message, options = {}) {
        return new FlashMessage(message, 'warning', options)
    }

    static error (message, options = {}) {
        return new FlashMessage(message, 'error', options)
    }

    static info (message, options = {}) {
        return new FlashMessage(message, 'info', options)
    }

    static addCustomVerbs (...verbs) {
        if (!verbs || !verbs.length) return
        verbs.forEach(verb => {
            if (!FlashMessage[verb])
                FlashMessage[verb] = (message, options = {}) => new FlashMessage(message, verb, options)
        })
    }

    destroy () {
        this.options.remove_delay = 0
        this._close()
    }
    
    _createContainer () {
        if (this.$_container === null || !document.body.contains(this.$_container)) {
            this.$_container = document.createElement('div')
            this.$_container.classList.add(this.options.classes.container)
            if (document.body.firstChild) document.body.insertBefore(this.$_container, document.body.firstChild)
            else document.body.appendChild(this.$_container)
        }
    }

    _composeMessage () {
        this.message = this.$_element.dataset.message || this.$_element.innerHTML || ''
        this.type = this.$_element.dataset.type || 'error'
        this.$_element.classList.add(`flash-${this.type}`)
    }

    _createMessage () {
        if (!this.$_element) {
            this.$_element = document.createElement('div')
            this.$_element.classList.add(this.options.classes.flash, `flash-${this.type}`)
            this.$_element.setAttribute('data-type', this.type)
            this.$_element.setAttribute('data-message', this.message)
            this.$_element.innerHTML = this.message

            this._append()
        }
        
        if (this._hasProgress()) this._progressBar()
        if (this.$_element.dataset.timeout)
            this.options.timeout = parseInt(this.$_element.dataset.timeout, 10)

        this._behavior()
        this._bindEvents()
    }

    _append () {
        this.$_container.appendChild(this.$_element)
    }

    _behavior () {
        window.setTimeout(() => {
            this.$_element.classList.add(this.options.classes.visible)
            this._run()
        }, this.options.appear_delay)
    }

    _run () {
        this._startProgress()
        this._c_timeout = window.setTimeout(() => this._close(), this.options.timeout)
    }

    _stop () {
        if (this._c_timeout !== null) {
            window.clearTimeout(this._c_timeout)
            this._stopProgress()
            this._c_timeout = null
        }
    }

    _close () {
        this.$_element.classList.remove(this.options.classes.visible)
        this._stopProgress()
        window.setTimeout(() => {
            this.$_container.removeChild(this.$_element)
            this._unbindEvents()
            this._clear()
        }, this.options.remove_delay)
    }

    _clear () {
        if (
            !this.$_container.children.length 
            && this.$_container.parentNode.contains(this.$_container)
        ) this.$_container.parentNode.removeChild(this.$_container)
    }


    _bindEvents () {
        this._bindEvent('mouseover', () => this._stop())
        this._bindEvent('mouseleave', () => this._run())
        this._bindEvent('click', () => this._close())
        
    }

    _bindEvent (event_name, callback) {
        try {
            if (!this.$_element.addEventListener) this.$_element.attachEvent(`on${this._getCapitalizedEventName(event_name)}`, callback)
            else this.$_element.addEventListener(event_name, callback, false)
        } catch (err) {
            throw new Error(`FlashMessage._bindEvent - Cannot add event on element - ${err}`)
        }
        
    }

    _unbindEvents () {
        this._unbindEvent('mouseover', () => this._stop())
        this._unbindEvent('mouseleave', () => this._run())
        this._unbindEvent('click', () => this._close())
    }

    _unbindEvent (event_name, callback) {
        try {
            if (!this.$_element.removeEventListener) this.$_element.detachEvent(`on${this._getCapitalizedEventName(event_name)}`, callback)
            else this.$_element.removeEventListener(event_name, callback, false)
        } catch (err) {
            throw new Error(`FlashMessage._unbindEvent - Cannot remove event on element - ${err}`)
        }
    }
    
    _getCapitalizedEventName (event_name) {
        return event_name.charAt(0).toUpperCase() + event_name.substr(1)
    }

    _hasProgress () {
        return Boolean(this.options.progress)
    }
    
    _progressBar () {
        this.$_progress = document.createElement('div')
        this.$_progress.classList.add(this.options.classes.progress)
        this.$_element.appendChild(this.$_progress)
    }

    _startProgress () {
        if (!this._hasProgress()) return
        this._stopProgress ()
        let _progress_ratio = 0
        this.$_progress.classList.remove(this.options.classes.progress_hidden)
        this._interval = window.setInterval(() => {
            this.$_progress.style.width = `${this._progress}%`
            this._progress = ((_progress_ratio * 100) / this.options.timeout).toFixed(2)
            _progress_ratio += 16
            if (this._progress >= 100)
                this._stopProgress()
            }, 16)
    }


    _stopProgress () {
        if (!this._hasProgress()) return
        this.$_progress.classList.add('is-hidden')
        window.clearInterval(this._interval)
        this._interval = null
        this._progress = null
    }

}
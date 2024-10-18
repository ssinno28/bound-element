export const eventsMixin = {
    onClick(func, propagate) {
        this.element.addEventListener('click', func, propagate);
        this.aggregateEvent('click', func, propagate);
        return this;
    },

    onSubmit(func, propagate) {
        this.element.addEventListener('submit', func, propagate);
        this.aggregateEvent('submit', func, propagate);
        return this;
    },

    onChange(func, propagate) {
        this.element.addEventListener('change', func, propagate);
        this.aggregateEvent('change', func, propagate);
        return this;
    },

    onMouseOver(func, propagate) {
        this.element.addEventListener('mouseover', func, propagate);
        this.aggregateEvent('mouseover', func, propagate);
        return this;
    },

    onFocus(func, propagate) {
        this.element.addEventListener('focus', func, propagate);
        this.aggregateEvent('focus', func, propagate);
        return this;
    },

    onEvent(event, func, propagate) {
        this.element.addEventListener(event, func, propagate);
        this.aggregateEvent(event, func, propagate);
        return this;
    },

    onMouseOut(func, propagate) {
        this.element.addEventListener('mouseout', func, propagate);
        this.aggregateEvent('mouseout', func, propagate);
        return this;
    },

    aggregateEvent: function (eventType, func, propagate) {
        this._eventRemovals.push(function() {
            this.element.removeEventListener(eventType, func);
        }.bind(this));

        this._eventAdditions.push(function() {
            this.element.addEventListener(eventType, func, propagate);
        }.bind(this));
    },

    bindEvents() {
        this.bindEventsRecursive([this]);
    },

    bindEventsRecursive(children) {
        children.forEach(function (child) {
            child._eventAdditions.forEach((eventAddition) => {
                eventAddition();
            })

            if (child.children && child.children.length > 0) {
                this.bindEventsRecursive(child.children);
            }
        }.bind(this));
    },

    unbindEvents() {
        this._eventRemovals.forEach(function (eventRemoval) {
            eventRemoval();
        });
    }
};
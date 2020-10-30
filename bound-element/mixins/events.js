import * as _ from "lodash";

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

    onMouseOut(func, propagate) {
        this.element.addEventListener('mouseout', func, propagate);
        this.aggregateEvent('mouseout', func, propagate);
        return this;
    },

    aggregateEvent: function (eventType, func, propagate) {
        this._eventRemovals.push(_.bind(() => {
            this.element.removeEventListener(eventType, func);
        }, this));

        this._eventAdditions.push(_.bind(() => {
            this.element.addEventListener(eventType, func, propagate);
        }));
    },

    bindEvents() {
        this.bindEventsRecursive([this]);
    },

    bindEventsRecursive(children) {
        _.each(children, _.bind(function (child) {
            _.each(child._eventAdditions, (eventAddition) => {
                eventAddition();
            });

            if (!_.isEmpty(child.children)) {
                this.bindEventsRecursive(child.children);
            }
        }, this));
    },

    unbindEvents() {
        _.each(this._eventRemovals, function (eventRemoval) {
            eventRemoval();
        });
    }
};
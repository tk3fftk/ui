import Ember from 'ember';

export default Ember.Component.extend({
  classNames: ['step-view'],
  classNameBindings: ['status'],
  isOpen: false,

  /**
   * Maps step exit code with status.
   * @property {String} status
   */
  status: Ember.computed('code', 'startTime', {
    get() {
      const code = this.get('code');
      const startTime = this.get('startTime');

      if (!startTime) {
        return 'queued';
      }

      if ((code === undefined || code === null) && startTime) {
        return 'running';
      }

      return code === 0 ? 'success' : 'failure';
    }
  }),

  /**
   * Maps step status with different icon.
   * @property {String} icon
   */
  icon: Ember.computed('status', {
    get() {
      switch (this.get('status')) {
      case 'running':
        return 'fa-spinner fa-spin';
      case 'success':
        return 'fa-check';
      case 'failure':
        return 'fa-times';
      default:
        return '';
      }
    }
  }),

  /**
   * Returns true if the step is running otherwise false.
   * @property {Boolean} isRunning
   */
  isRunning: Ember.computed('status', {
    get() {
      return this.get('status') === 'running';
    }
  }),

  /**
   * Returns estimate duration in seconds for a step
   * @property {Number} duration
   */
  estimate: Ember.computed({
    get() {
      const stepName = this.get('stepName');

      console.log(this.get('estimateTime'));
      const estimateTime = this.get('estimateTime').then((builds) => {
        let durations = [];

        builds.forEach((build) => {
          const steps = build.get('steps');

          durations.push(steps.map((step) => {
            if (step.name === stepName) {
              const start = step.startTime;
              const end = step.endTime;

              if (end && start) {
                return Date.parse(end) - Date.parse(start);
              }
            }

            return null;
          }));
        });

        const flattenedDurations = [].concat.apply([], durations);
        const filteredDurations = flattenedDurations.filter(val => val !== null);

        const sum = filteredDurations.reduce((a, b) => a + b);

        return sum / filteredDurations.length;
      }).then((averageTime) => {
        if (averageTime) {
          console.log(humanizeDuration(averageTime, { round: true, largest: 2 }));

          return humanizeDuration(averageTime, { round: true, largest: 2 });
        }

        return null;
      });

      return estimateTime;
    }
  }),

  /**
   * Returns duration in seconds for a completed step
   * @property {Number} duration
   */
  duration: Ember.computed('startTime', 'endTime', {
    get() {
      const start = this.get('startTime');
      const end = this.get('endTime');

      if (end && start) {
        const duration = Date.parse(end) - Date.parse(start);

        return humanizeDuration(duration, { round: true, largest: 2 });
      }

      return null;
    }
  }),

  /**
   * Returns the duration in seconds for when this build last started
   * @property {Number} startTimeFromNow
   */
  startTimeFromNow: Ember.computed('startTime', 'now', {
    get() {
      const start = Date.parse(this.get('startTime'));

      if (start) {
        const duration = Date.now() - start;

        return `${humanizeDuration(duration, { round: true, largest: 2 })} ago`;
      }

      return null;
    }
  }),

  /**
   * Update the property now every second
   * @method timer
   */
  timer: function timer() {
    const interval = 1000;

    setInterval(() => {
      Ember.run(() => {
        this.notifyPropertyChange('now');
      });
    }, interval);
  }.on('init'),

  /**
   * Allow user to click on a step to open the logs
   * @method click
   */
  click() {
    if (this.get('status') !== 'queued') {
      this.get('onToggle')();
    }
  }
});

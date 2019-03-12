import React, { Component } from 'react';
import moment from 'moment';
import { orderBy } from 'lodash';
import welcomeImage from '../images/welcome.svg';
import spinner from '../images/spinner.svg';
import { GOOGLE_API_KEY, CALENDAR_ID } from '../config.js';

const timestampNow = moment().toISOString();
const timestampEndOfDay = moment()
  .endOf('day')
  .toISOString();

class App extends Component {
  state = {
    time: moment().format('LLLL'),
    events: [],
    isBusy: false,
    isEmpty: false,
    isLoading: false,
  };

  componentDidMount() {
    this.loadClient();

    setInterval(this.tick, 1000);
    setInterval(this.getEvents, 60000);
  }

  loadClient() {
    gapi.load('client', this.initClient);
  }

  initClient = () => {
    gapi.client.init({ apiKey: GOOGLE_API_KEY }).then(this.getEvents);
  };

  getEvents = () => {
    this.setState({ isLoading: true });

    gapi.client
      .request({
        path: `https://www.googleapis.com/calendar/v3/calendars/${CALENDAR_ID}/events`,
        params: {
          timeMin: timestampNow,
          timeMax: timestampEndOfDay,
          maxResults: 10,
          singleEvents: true,
          orderBy: 'startTime',
        },
      })
      .then(
        response => {
          const { items: events } = response.result;
          const sortedEvents = orderBy(events, event =>
            moment(event.start.dateTime).format('YYYYMMDD'),
          );

          this.setState(
            {
              events: sortedEvents,
              isLoading: false,
              isEmpty: events.length === 0,
              isBusy: events.length,
            },
            this.updateStatus,
          );
        },
        response => {
          const { error } = response.result;
          console.log(error.message);
        },
      );
  };

  tick = () => {
    const time = moment().format('LLLL');

    this.setState({ time });
  };

  updateStatus = () => {
    const now = moment();
    const { events } = this.state;

    const isBusy = events.some(event => {
      return now.isBetween(
        moment(event.start.dateTime),
        moment(event.end.dateTime),
      );
    });

    this.setState({ isBusy });
  };

  render() {
    const { time, events, isBusy, isLoading, isEmpty } = this.state;

    const eventList = events.map(event => (
      <a
        className="list-group-item"
        href={event.htmlLink}
        target="_blank"
        key={event.id}
      >
        <h3>{moment(event.start.dateTime).format('MMMM Do')}</h3>
        <h4>{event.summary}</h4>
        <ul>
          <li>Start: {moment(event.start.dateTime).format('h:mm a')}</li>
          <li>
            Duration:{' '}
            {moment(event.end.dateTime).diff(
              moment(event.start.dateTime),
              'minutes',
            )}{' '}
            minutes
          </li>
        </ul>
      </a>
    ));

    const loadingState = (
      <div className="loading">
        <img src={spinner} alt="Loading…" />
      </div>
    );

    const emptyState = (
      <div className="empty">
        <img src={welcomeImage} alt="Welcome" />
        <h3>
          No meetings are scheduled for the day. Create one by clicking the
          button below.
        </h3>
      </div>
    );

    return (
      <div className="container">
        <div className={`current-status ${isBusy ? 'busy' : 'open'}`}>
          <h1>{isBusy ? 'Busy' : 'Open'}</h1>
        </div>

        <div className="upcoming-meetings">
          <div className="current-time">{time}</div>

          <h1>Upcoming Meetings</h1>

          <div className="list-group">
            {isLoading && loadingState}

            {events.length > 0 && eventList}

            {isEmpty && emptyState}
          </div>

          <a
            className="primary-cta"
            href="https://calendar.google.com/calendar?cid=c3FtMnVkaTFhZGY2ZHM3Z2o5aDgxdHVldDhAZ3JvdXAuY2FsZW5kYXIuZ29vZ2xlLmNvbQ"
            target="_blank"
          >
            +
          </a>
        </div>
      </div>
    );
  }
}

export default App;

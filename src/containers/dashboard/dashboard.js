import React, { Component } from "react";
import PropTypes from "prop-types";
import moment from "moment";
import "./dashboard.css";
import UserEventcards from "../../components/eventCards/userEventCards";

import { Row, Button, message, Checkbox } from "antd";
import SearchBox from "../../components/commonComponents/searchBox";
import SelectDropDown from "../../components/commonComponents/selectDropdown";
import StyledRangePicker from "../../components/commonComponents/rangePicker";
import { SyncOutlined } from "@ant-design/icons";
import { connect } from "react-redux";
import {
  fetchEvents,
  getEventData,
  setEventUpdate,
} from "../../actions/eventActions";
import { statusList, feeTypeList} from '../../constants/constants'
import BackButton from "../../components/commonComponents/backButton";

/**
 * Dashboard for events management
 * consists the events 
 * filters to filter and search events based on :
 * name
 * location
 * event type
 * fees
 * event status
 * created by me for organizers
 * also consists of create button for organizers to create a new event
 */
class Dashboard extends Component {
  constructor(props) {
    super(props);
    this.state = {
      eventList: [],
      spinning: true,
      isChecked: false,
      isWishlist: false,
      searchText: "",
      startDate: "",
      endDate: "",
      eventType: "",
      statusType: "upcoming",
      feeType: "",
      role: this.props.userRole,
    };
  }
  componentDidMount() {
    this.fetchEventsList();
  }

  componentDidUpdate(prevProps) {
    if (this.props.eventList !== prevProps.eventList) {
      this.setState({
        eventList: this.props.eventList,
      });
    }
    if (prevProps.location.search !== this.props.location.search) {
      this.fetchEventsList();
    }
  }

  //fetch events list based on different filters and searchs
  fetchEventsList = () => {
    const {
      fetchEvents,
      userData,
      accessToken,
      location: { search },
    } = this.props;
    let searchParam = new URLSearchParams(search);
    let type = searchParam.get("type");
    if (type !== "wishlist") {
      fetchEvents({ userData, 
        accessToken,
        filterData: { 
          event_status: this.state.statusType,
          subscription_type: this.state.feeType !== "" ? this.state.feeType : undefined
        }
      });
      this.setState({
        isChecked: false,
        isWishlist: false,
        searchText: "",
        startDate: "",
        endDate: "",
        eventType: "",
        statusType: "upcoming",
        feeType: ""
      });
    } else if (type === "wishlist") {
      fetchEvents({
        userData,
        accessToken,
        filterData: { is_wishlisted: "True" },
      });
      this.setState({
        isChecked: false,
        isWishlist: true,
        searchText: "",
        startDate: "",
        endDate: "",
        eventType: "",
        statusType: "upcoming",
        feeType: ""
      });
    }
  };

  //to take users to event details page on click of a event card
  handleEventClick = (id) => {
    const { getEventData, accessToken, history, userRole } = this.props;
    getEventData({
      id,
      accessToken,
      userRole,
      callback: (error) => {
        if (!error) {
          history.push(`/event-details?id=${id}`);
        } else {
          message.error(error);
        }
      },
    });
  };

  //to diaply events in rows of 4
  spliceArray = (list) => {
    return (
      <Row className="cards-row">
        {list.map((event, index) => {
          return (
            <UserEventcards
              history={this.props.history}
              key={index}
              event={event}
              onClick={this.handleEventClick}
            />
          );
        })}
      </Row>
    );
  };

  //to appy different filters
  applyFilters = () => {
    const { fetchEvents, userData, accessToken } = this.props;
    const {
      isWishlist,
      isChecked,
      startDate,
      endDate,
      eventType,
      statusType,
      feeType,
      searchText,
    } = this.state;
    let filterData = {
      type: eventType,
      event_status: statusType,
      subscription_type: feeType !== "" ? feeType : undefined,
      is_wishlisted: isWishlist ? "True" : undefined,
      event_created_by: isChecked ? "True" : undefined,
      startDate: startDate !== "" ? startDate : undefined,
      endDate: startDate !== "" && endDate !== "" ? endDate : undefined,
      search: searchText !== "" ? searchText : undefined,
    };
    fetchEvents({ userData, accessToken, filterData });
  };

  //to remove and reset the filters and search
  removeFilters = () => {
    const { fetchEvents, userData, accessToken } = this.props;
    this.setState(
      {
        isChecked: false,
        searchText: "",
        startDate: "",
        endDate: "",
        eventType: "",
        statusType: "upcoming",
        feeType: ""
      },
      () => {
        fetchEvents({
          userData,
          accessToken,
          filterData: {
            is_wishlisted: this.state.isWishlist ? "True" : undefined,
            event_status: "upcoming",
          },
        });
      }
    );
  };

  // to handle event type filter change
  handleFilterChange = (value) => {
    this.setState(
      {
        eventType: value,
      },
      () => {
        this.applyFilters();
      }
    );
  };

  //to handel event status filter change
  handleStatusFilterChange = (value) => {
    this.setState(
      {
        statusType: statusList[value]['type'],
      },
      () => {
        this.applyFilters();
      }
    );
  };

  //handle fee type filter change
  handleFeeFilterChange = (value) => {
    this.setState(
      {
        feeType: feeTypeList[value]['type'],
      },
      () => {
        this.applyFilters();
      }
    );
  };
  handleSearchTextChange = (value) => {
    this.setState({
      searchText: value.target.value,
    })
  }

  //handle date range change
  handleDateChange = (date, dateString) => {
    if (dateString[0] !== "" && dateString[1] != "") {
      const startDate = moment(dateString[0], "DD-MM-YYYY").format(
        "YYYY-MM-DD"
      );
      const endDate = moment(dateString[1], "DD-MM-YYYY").format("YYYY-MM-DD");
      this.setState(
        {
          startDate: startDate,
          endDate: endDate,
        },
        () => {
          this.applyFilters();
        }
      );
    } else
      this.setState(
        {
          startDate: "",
          endDate: "",
        },
        () => {
          this.applyFilters();
        }
      );
  };

  // handle click of create button for organizers
  handleCreateEvent = () => {
    this.props.history.push("create");
  };

  //to search with the search text and filter events based on location/name
  handleKeyPress = (event) => {
      const searchText = event.target.value;
      this.setState(
        {
          searchText: searchText,
        },
        () => {
          this.applyFilters();
        }
      );
  };

  //handle checkbox is created by me change
  handleCheckChange = () => {
    this.setState(
      {
        isChecked: !this.state.isChecked,
      },
      () => {
        this.applyFilters();
      }
    );
  };

  // to come back to dashbaord from wishlist
  goBack = () => {
    this.props.history.push("/dashboard");
  };

  render() {
    const { eventList, isWishlist, searchText } = this.state;
    return (
        <div className="sub-content">
          {!isWishlist ? (
            <div className="events-heading"> Event Management </div>
          ) : (
            <BackButton handleOnClick={this.goBack} text={"Wishlist"} />
          )}
          <div className="dashboard-actions-container">
            <div className="filters">
              <Button onClick={this.removeFilters} style={{marginRight:"1%"}}><SyncOutlined /></Button>
              <SearchBox
                handleOnChange={this.handleSearchTextChange}
                placeholder={"Name / Location"}
                handleKeyPress={this.handleKeyPress}
                value = {searchText}
              />
              <SelectDropDown
                allOptionRequired={true}
                handleChange={this.handleFilterChange}
                optionsList={this.props.eventType}
                placeholder={"Event Type"}
                value = {this.state.eventType}
              />
              <SelectDropDown
                handleChange={this.handleStatusFilterChange}
                optionsList={statusList}
                placeholder={"Status"}
                value = {this.state.statusType}
              />
              <SelectDropDown
                handleChange={this.handleFeeFilterChange}
                optionsList={feeTypeList}
                placeholder={"Fee Type"}
                value = {this.state.feeType}
              />
              <StyledRangePicker handleChange={this.handleDateChange} values = {{startDate:this.state.startDate, endDate:this.state.endDate}}/>
              {this.props.userRole === "organizer" && (
                <div className="checkbox-style">
                  <Checkbox
                    checked={this.state.isChecked}
                    onChange={this.handleCheckChange}
                    size="large"
                    className="checkbox-me"
                  >
                    Created By Me
                  </Checkbox>
                </div>
              )}
            </div>
            {this.props.userRole === "organizer" && (
              <Button type="primary" className="create-button" onClick={this.handleCreateEvent}>
                Create
              </Button>
            )}
          </div>
          <div className="events-container-flex">
            {this.spliceArray(eventList)}
          </div>
        </div>
    );
  }
}

Dashboard.propTypes = {
  history: PropTypes.object,
  location: PropTypes.object,
  userRole: PropTypes.string,
  userData: PropTypes.object,
  eventList: PropTypes.array,
  accessToken: PropTypes.string,
  fetchEvents: PropTypes.func,
  fetchingEvent: PropTypes.bool,
  getEventData: PropTypes.func,
  eventType: PropTypes.array,
  setEventUpdate: PropTypes.func,
};

const mapStateToProps = ({
  userReducer: { userRole, userData, accessToken, eventType },
  eventReducer: { eventList, fetchingEvent },
}) => ({
  userRole,
  userData,
  accessToken,
  eventType,
  eventList,
  fetchingEvent,
});
const mapDispatchToProps = {
  fetchEvents: fetchEvents,
  getEventData: getEventData,
  setEventUpdate: setEventUpdate,
};

export default connect(mapStateToProps, mapDispatchToProps)(Dashboard);

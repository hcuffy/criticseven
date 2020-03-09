import React, { Component } from "react";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import { actionCreators } from "./actions/index";
import Movies from "./components/Movies";
import "./App.css";

class App extends Component {
  componentDidMount() {
    this.props.actions.getMovies();
  }

  render() {
    return (
      <div className="App">
        <Movies />
      </div>
    );
  }
}

const mapDispatchToProps = dispatch => ({
  actions: bindActionCreators(actionCreators, dispatch)
});

export default connect(null, mapDispatchToProps)(App);

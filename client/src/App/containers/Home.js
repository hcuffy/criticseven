import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { actionCreators } from '../actions/index'

const Movies = ({ moviesData, actions }) => {
  return (
    <div className={'main_div'}>
      <h4>HOME</h4>
    </div>
  )
}

const mapStateToProps = state => ({
  moviesData: state.moviesData
})

const mapDispatchToProps = dispatch => ({
  actions: bindActionCreators(actionCreators, dispatch)
})

export default connect(mapStateToProps, mapDispatchToProps)(Movies)

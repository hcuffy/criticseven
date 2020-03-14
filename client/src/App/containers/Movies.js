import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { actionCreators } from '../actions/index'
import { useTranslation } from 'react-i18next'

const Movies = ({ moviesData, actions }) => {
  const { t } = useTranslation()

  return (
    <div className={'main_div'}>
      <h4>{t('header.test')}</h4>
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

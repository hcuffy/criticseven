import React from 'react'
import { useTranslation } from 'react-i18next'
import type { MovieList } from './types'
import './styles.css'

export default function Movies({ moviesData }: { moviesData: MovieList }) {
  const { t } = useTranslation()

  return (
    <div className="main_div">
      <h4>{t('header.test')}</h4>
      <ul>
        {moviesData.results.map(movie => (
          <li key={movie.id}>
            {movie.title} ({movie.release_date?.slice(0, 4)})
          </li>
        ))}
      </ul>
    </div>
  )
}

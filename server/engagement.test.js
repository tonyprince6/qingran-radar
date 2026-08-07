import test from 'node:test'
import assert from 'node:assert/strict'
import { engagementScore, formatCount, rankByEngagement } from '../src/services/engagement.js'

test('ranks videos by weighted real engagement and leaves missing data last', () => {
  const videos = [
    { title: 'missing' },
    { title: 'liked', likeCount: 100, commentCount: 2, favoriteCount: 3, shareCount: 1 },
    { title: 'saved', likeCount: 80, commentCount: 2, favoriteCount: 20, shareCount: 5 },
  ]
  assert.equal(engagementScore(videos[1]), 123)
  assert.deepEqual(rankByEngagement(videos).map(video => video.title), ['saved', 'liked', 'missing'])
})

test('formats large counters for the dashboard', () => {
  assert.equal(formatCount(94), '94')
  assert.equal(formatCount(12_400), '1.2万')
})

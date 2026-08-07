import test from 'node:test'
import assert from 'node:assert/strict'
import { engagementScore, formatCount, growth24hMode, growth24hScore, rankByEngagement, rankVideos } from '../src/services/engagement.js'

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

test('filters to the last 24 hours and ranks by weighted engagement velocity', () => {
  const capturedAt = '2026-08-07T08:00:00+08:00'
  const videos = [
    { title: 'fast', publishedAt: '2026年8月7日 06:00', likeCount: 40, commentCount: 0, favoriteCount: 0, shareCount: 0 },
    { title: 'slow', publishedAt: '2026年8月6日 20:00', likeCount: 120, commentCount: 0, favoriteCount: 0, shareCount: 0 },
    { title: 'old', publishedAt: '2026年8月5日 06:00', likeCount: 1000, commentCount: 0, favoriteCount: 0, shareCount: 0 },
  ]
  assert.equal(growth24hScore(videos[0], capturedAt), 20)
  assert.equal(growth24hMode(videos[0], capturedAt), '估算')
  assert.deepEqual(rankVideos(videos, 'growth24h', capturedAt).map(video => video.title), ['fast', 'slow'])
})

test('uses a previous snapshot when measured 24 hour growth is available', () => {
  const video = {
    publishedAt: '2026年8月5日 06:00',
    likeCount: 140,
    commentCount: 0,
    favoriteCount: 0,
    shareCount: 0,
    engagementHistory: [{ capturedAt: '2026-08-07T04:00:00+08:00', likeCount: 100, commentCount: 0, favoriteCount: 0, shareCount: 0 }],
  }
  assert.equal(growth24hScore(video, '2026-08-07T08:00:00+08:00'), 10)
  assert.equal(growth24hMode(video, '2026-08-07T08:00:00+08:00'), '实测')
})

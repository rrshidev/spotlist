import { describe, it, expect } from 'vitest'

describe('Spot types', () => {
  it('Spot interface requires name and coordinates', () => {
    const spot = {
      id: '123',
      name: 'Test Spot',
      latitude: 55.75,
      longitude: 37.61,
      city: 'Moscow',
      category: 'park' as const,
      media: [],
      screenshot: null,
      author_id: 'user1',
      author_username: 'testuser',
      author_avatar: null,
      is_checked: true,
      likes_count: 0,
      liked: false,
      created_at: new Date().toISOString(),
    }
    expect(spot.name).toBe('Test Spot')
    expect(spot.category).toBe('park')
    expect(spot.latitude).toBe(55.75)
    expect(spot.longitude).toBe(37.61)
  })

  it('Spot category can be routes', () => {
    const spot = {
      id: '456',
      name: 'Route Spot',
      latitude: 55.75,
      longitude: 37.61,
      city: 'Moscow',
      category: 'routes' as const,
      media: [],
      screenshot: 'http://example.com/screenshot.jpg',
      author_id: 'user1',
      author_username: null,
      author_avatar: null,
      is_checked: true,
      likes_count: 5,
      liked: true,
      created_at: new Date().toISOString(),
    }
    expect(spot.category).toBe('routes')
    expect(spot.screenshot).toBeTruthy()
    expect(spot.liked).toBe(true)
    expect(spot.likes_count).toBe(5)
  })
})

describe('Comment type', () => {
  it('Comment has required fields', () => {
    const comment = {
      id: 'c1',
      spot_id: 's1',
      user_id: 'u1',
      username: 'user',
      user_avatar: null,
      content: 'Great spot!',
      parent_id: null,
      is_reported: false,
      created_at: new Date().toISOString(),
      updated_at: null,
    }
    expect(comment.content).toBe('Great spot!')
    expect(comment.is_reported).toBe(false)
  })
})

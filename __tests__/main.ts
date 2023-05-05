import {describe, expect, test} from '@jest/globals';
import { getNewZipDetail, isAnUpdate} from '../src/helper'
describe('isAnUpdate', () => {
    test('7.4.1 is newer than 7.4.0', () => {
        expect(isAnUpdate('7.4.0', '7.4.1')).toBe(true)
    })
    test('7.4.0 is newer than 7.4.0 should return false', () => {
        expect(isAnUpdate('7.4.0', '7.4.0')).toBe(false)
    })
    // 7.4.0 is greater than 7.3.01
    test('7.4.0 is newer than 7.3.01 should return true', () => {
        expect(isAnUpdate('7.3.01', '7.4.0')).toBe(true)
    })
    test('7.3.0 is newer than 7.4.0 should return false', () => {
        expect(isAnUpdate('7.4.0', '7.3.0')).toBe(false)
    })
})

describe('getNewZipDetail', () => {
    test('is an onject', async () => {
        expect(await getNewZipDetail()).toBeInstanceOf(Object)
    })
    test('has a version property',async  () => {
        expect(await getNewZipDetail()).toHaveProperty('version')
    })
    test('has a url property', async () => {
        expect(await getNewZipDetail()).toHaveProperty('href')
    })
})
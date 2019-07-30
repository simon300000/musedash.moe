import Vue from 'vue'
import ky from 'ky-universal'

const url = new Vue().$isServer ? 'http://0.0.0.0:8301/' : 'http://0.0.0.0:8301/'

const get = api => ky(`${url}${api}`).json()

export const getAlbums = () => get('albums')

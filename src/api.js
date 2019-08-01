import Vue from 'vue'
import axios from 'axios'

const url = new Vue().$isServer ? 'http://0.0.0.0:8301/' : 'http://0.0.0.0:8301/'

const get = async api => (await axios(`${url}${api}`)).data

export const getAlbums = () => get('albums')

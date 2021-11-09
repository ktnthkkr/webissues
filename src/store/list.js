/**************************************************************************
* This file is part of the WebIssues Server program
* Copyright (C) 2006 Michał Męciński
* Copyright (C) 2007-2020 WebIssues Team
*
* This program is free software: you can redistribute it and/or modify
* it under the terms of the GNU Affero General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.
*
* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
* GNU Affero General Public License for more details.
*
* You should have received a copy of the GNU Affero General Public License
* along with this program.  If not, see <http://www.gnu.org/licenses/>.
**************************************************************************/

import { Column } from '@/constants'

const PageSize = 50;

const MaxExportSize = 10000;

const UpdateInterval = 60 * 1000; // 1 minute

export default function makeListModule( ajax ) {
  return {
    namespaced: true,
    state: makeState(),
    getters: makeGetters(),
    mutations: makeMutations(),
    actions: makeActions( ajax )
  };
}

function makeState() {
  return {
    typeId: null,
    viewId: null,
    projectId: null,
    folderId: null,
    searchColumn: Column.Name,
    searchText: '',
    searchValue: '',
    searchError: false,
    overrideSort: false,
    sortColumn: null,
    sortAscending: false,
    offset: 0,
    columns: [],
    issues: [],
    totalCount: 0,
    lastPromise: null,
    lastUpdate: null,
    dirty: false
  };
}

function makeGetters() {
  return {
    areFiltersEqual( state ) {
      return ( { typeId, viewId, projectId, folderId } ) => {
        return state.typeId == typeId && state.viewId == viewId && state.projectId == projectId && state.folderId == folderId;
      };
    },
    checkUpdate( state, getters ) {
      return () => {
        return getters.type != null && ( state.dirty || state.lastUpdate == null || ( Date.now() - state.lastUpdate ) >= UpdateInterval );
      };
    },
    hasFilters( state ) {
      return state.typeId != null || state.viewId != null || state.folderId != null;
    },
    type( state, getters, rootState ) {
      if ( state.typeId != null )
        return rootState.global.types.find( t => t.id == state.typeId );
      else if ( state.viewId != null )
        return rootState.global.types.find( t => t.views.some( v => v.id == state.viewId ) );
      else if ( state.folderId != null )
        return rootState.global.types.find( t => t.id == getters.folder.typeId );
      else
        return null;
    },
    view( state, getters ) {
      if ( state.viewId != null && getters.type != null )
        return getters.type.views.find( v => v.id == state.viewId );
      else
        return null;
    },
    publicViews( state, getters ) {
      if ( getters.type != null )
        return getters.type.views.filter( v => v.public );
      else
        return [];
    },
    personalViews( state, getters ) {
      if ( getters.type != null )
        return getters.type.views.filter( v => !v.public );
      else
        return [];
    },
    project( state, getters, rootState ) {
      if ( state.projectId != null )
        return rootState.global.projects.find( p => p.id == state.projectId );
      else if ( state.folderId != null )
        return rootState.global.projects.find( p => p.folders.some( f => f.id == state.folderId ) );
      else
        return null;
    },
    folder( state, getters ) {
      if ( state.folderId != null && getters.project != null )
        return getters.project.folders.find( f => f.id == state.folderId );
      else
        return null;
    },
    folders( state, getters ) {
      if ( getters.project != null && getters.type != null )
        return getters.project.folders.filter( f => f.typeId == getters.type.id );
      else
        return [];
    },
    firstIndex( state ) {
      if ( state.totalCount > 0 )
        return state.offset + 1;
      else
        return null;
    },
    lastIndex( state ) {
      if ( state.totalCount > 0 )
        return Math.min( state.offset + PageSize, state.totalCount );
      else
        return null;
    },
    title( state, getters ) {
      let title = null;
      if ( getters.type != null ) {
        title = getters.type.name;
        if ( getters.view != null )
          title += ' - ' + getters.view.name;
        if ( getters.project != null ) {
          title += ' | ' + getters.project.name;
          if ( getters.folder != null )
            title += ' - ' + getters.folder.name;
        }
      }
      return title;
    },
    isIssueModified( state ) {
      return issueId => {
        const issue = state.issues.find( i => i.id == issueId );
        return issue != null && issue.read < issue.stamp;
      };
    }
  };
}

function makeMutations() {
  return {
    clear( state ) {
      state.typeId = null;
      state.viewId = null;
      state.projectId = null;
      state.folderId = null;
      state.searchColumn = Column.Name;
      state.searchText = '';
      state.searchValue = '';
      state.searchError = false;
      state.overrideSort = false;
      state.sortColumn = null;
      state.sortAscending = false;
      state.offset = 0;
      state.columns = [];
      state.issues = [];
      state.totalCount = 0;
      state.lastPromise = null;
      state.lastUpdate = null;
      state.dirty = false;
    },
    cancel( state ) {
      state.lastPromise = null;
    },
    setFilters( state, { typeId, viewId, projectId, folderId } ) {
      state.typeId = typeId;
      state.viewId = viewId;
      state.projectId = projectId;
      state.folderId = folderId;
    },
    setSearchColumn( state, { searchColumn } ) {
      state.searchColumn = searchColumn;
      state.searchText = '';
      state.searchValue = '';
      state.searchError = false;
    },
    setSearchText( state, { searchText } ) {
      state.searchText = searchText;
    },
    setSearchError( state, { searchText } ) {
      state.searchText = searchText;
      state.searchError = true;
    },
    setSearchValue( state, { searchText, searchValue } ) {
      state.searchText = searchText;
      state.searchValue = searchValue;
      state.searchError = false;
      state.offset = 0;
    },
    setSortOrder( state, { sortColumn, sortAscending } ) {
      state.overrideSort = true;
      state.sortColumn = sortColumn;
      state.sortAscending = sortAscending;
      state.offset = 0;
    },
    setPreviousPage( state ) {
      state.offset -= PageSize;
    },
    setNextPage( state ) {
      state.offset += PageSize;
    },
    setDirty( state ) {
      state.dirty = true;
    },
    setIssueState( state, { issueId, stamp, subscribed } ) {
      const issue = state.issues.find( i => i.id == issueId );
      if ( issue != null ) {
        issue.read = stamp;
        issue.subscribed = subscribed;
      }
    },
    setData( state, { sortColumn, sortAscending, columns, issues, totalCount } ) {
      state.sortColumn = sortColumn;
      state.sortAscending = sortAscending;
      state.columns = columns;
      state.issues = issues;
      state.totalCount = totalCount;
    },
    setLastPromise( state, value ) {
      state.lastPromise = value;
    },
    beginUpdate( state ) {
      state.lastUpdate = Date.now();
      state.dirty = false;
    }
  };
}

function makeActions( ajax ) {
  return {
    load( { state, commit } ) {
      commit( 'beginUpdate' );
      const query = makeBaseQuery( state );
      query.offset = state.offset;
      query.limit = PageSize;
      console.log(query);
      const promise = ajax.post( '/issues/list.php', query );
      commit( 'setLastPromise', promise );
      return new Promise( ( resolve, reject ) => {
        promise.then( data => {
          if ( promise == state.lastPromise ) {
            commit( 'setData', data );
            commit( 'setLastPromise', null );
            resolve();
          }
        } ).catch( error => {
          if ( promise == state.lastPromise ) {
            commit( 'setLastPromise', null );
            reject( error );
          }
        } );
      } );
    },
    dashboard({state, commit}){
      const query = makeBaseQuery( state );
      query.offset = state.offset;
      query.limit = PageSize;
      query.viewId = 7;
      console.log(query);
      const promise = ajax.post( '/issues/dashboard.php', query);
      commit( 'setLastPromise', promise );
      state.lastPromise = promise
      console.log(state.lastPromise);
      return new Promise( ( resolve, reject ) => {
        promise.then( data => {
          console.log(data);
          console.log("2 " + state.lastPromise);
          if (true || promise == state.lastPromise ) {
            console.log("Here Dashboard");
            commit( 'setData', data );
            commit( 'setLastPromise', null );
            resolve();
          }else{
            console.log('Here');
          }
        } ).catch( error => {
          console.log(error);
          if ( promise == state.lastPromise ) {
            commit( 'setLastPromise', null );
            reject( error );
          }
        } );
      } );
    },
    export( { state }, { allColumns } ) {
      const query = makeBaseQuery( state );
      query.offset = 0;
      query.limit = MaxExportSize;
      query.html = false;
      query.allColumns = allColumns;
      return ajax.post( '/issues/list.php', query );
    },

    markAll( { state }, { read } ) {
      const query = makeBaseQuery( state, { sort: false } );
      query.read = read;
      return ajax.post( '/issues/mark.php', query );
    }
  };
}

function makeBaseQuery( state, { sort = true } = {} ) {
  const query = {
    typeId: state.typeId,
    viewId: state.viewId,
    projectId: state.projectId,
    folderId: state.folderId
  };
  if ( state.searchValue != '' ) {
    query.searchColumn = state.searchColumn;
    query.searchValue = state.searchValue;
  };
  if ( sort && state.overrideSort ) {
    query.sortColumn = state.sortColumn;
    query.sortAscending = state.sortAscending;
  };
  return query;
}

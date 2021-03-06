import React from 'react';
import {
  StyleSheet,
  View,
  ListView,
  Platform,
  RefreshControl
} from 'react-native';
import {createStore, applyMiddleware} from 'redux';
import thunk from 'redux-thunk';
import Comments from '../../reducers/Comments'
import ShotHeader from './ShotHeader';
import CommentRow from './CommentRow';
import LoadingFooter from '../common/LoadingFooter';
import {Dimens, Colors, Strings} from '../../utils/Theme';
import CommentsAction from '../../actions/Comments';
import ToolbarView from '../common/ToolbarView';

class ShotComponent extends React.Component {
  constructor(props) {
    super(props);
    this.shot = this.props.shot;
    this.onRefresh = this.onRefresh.bind(this);
    this.onReachEnd = this.onReachEnd.bind(this);
    this.commentsStore = createStore(Comments, applyMiddleware(thunk));
  }

  componentDidMount() {
    this.unsubscribe = this.commentsStore.subscribe(() => {
      this.forceUpdate()
    });
    // Auto call the reach end to make first loading happen. This is tricky and caused by Navigator!!
    this.onReachEnd();
  }

  componentWillUnmount() {
    this.unsubscribe();
  }

  onRefresh() {
    // This is hacked, cause RefreshControl in iOS don't have enabled props
    const state = this.commentsStore.getState();
    if (state.loading) {
      this.commentsStore.dispatch(CommentsAction.resetPullRefresh());
    } else {
      this.commentsStore.dispatch(CommentsAction.refreshComments(this.shot.id));
    }
  }

  onReachEnd() {
    const state = this.commentsStore.getState();
    if (!(state.finished || state.loading || state.error)) {
      this.commentsStore.dispatch(CommentsAction.fetchFromBottom(this.shot.id, state.page));
    }
  }

  render() {
    const state = this.commentsStore.getState();
    const refreshControl = (
      <RefreshControl
        tintColor={Colors.primary}
        refreshing={state.refreshing}
        enabled={!state.loading}
        onRefresh={this.onRefresh}
      />
    );
    return (
      <View style={styles.container}>
        <ToolbarView title={Strings.titleShotDetail}/>
        <ListView
          contentContainerStyle={styles.commentsList}
          dataSource={state.dataSource}
          enableEmptySections={true}
          renderRow={(comment) => <CommentRow comment={comment} />}
          renderHeader={() => <ShotHeader shot={this.shot} />}
          onEndReachedThreshold={300}
          onEndReached={this.onReachEnd}
          renderFooter={() => <LoadingFooter {...state} />}
          refreshControl={refreshControl}
        />
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: Platform.OS === 'ios' ? Dimens.iOSTop : 0,
    backgroundColor: Colors.pageColor
  },
  commentsList: {
    alignItems: 'stretch'
  }

});

ShotComponent.propTypes = {
  shot: React.PropTypes.object.isRequired
};

module.exports = ShotComponent;
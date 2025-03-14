/* @flow strict-local */

import React, { useCallback, useMemo, useContext } from 'react';
import type { Node } from 'react';
import { View, SectionList } from 'react-native';

import { useNavigation } from '../react-navigation';
import type { RouteProp } from '../react-navigation';
import type { AppNavigationProp } from '../nav/AppNavigator';
import type { Subscription } from '../types';
import appStyles, { createStyleSheet, ThemeContext } from '../styles';
import { useDispatch, useSelector } from '../react-redux';
import LoadingBanner from '../common/LoadingBanner';
import SectionSeparatorBetween from '../common/SectionSeparatorBetween';
import SearchEmptyState from '../common/SearchEmptyState';
import { streamNarrow } from '../utils/narrow';
import { getUnreadByStream } from '../selectors';
import { getSubscriptions } from '../directSelectors';
import { doNarrow } from '../actions';
import { caseInsensitiveCompareFunc } from '../utils/misc';
import StreamItem from './StreamItem';
import ModalNavBar from '../nav/ModalNavBar';
import ZulipTextIntl from '../common/ZulipTextIntl';
import Touchable from '../common/Touchable';
import { IconRight } from '../common/Icons';

const styles = createStyleSheet({
  container: {
    flex: 1,
    flexDirection: 'column',
  },
  list: {
    flex: 1,
    flexDirection: 'column',
  },
  rightItem: {
    marginLeft: 'auto',
  },
  rightIcon: {
    marginLeft: 'auto',
  },
  allStreamsButton: {
    paddingRight: 12,
  },
  streamsText: {
    textTransform: 'uppercase',
    fontWeight: '500',
  },
});

type Props = $ReadOnly<{|
  navigation: AppNavigationProp<'subscribed'>,
  route: RouteProp<'subscribed', void>,
|}>;

type FooterProps = $ReadOnly<{||}>;

function AllStreamsButton(props: FooterProps): Node {
  const navigation = useNavigation();
  const themeContext = useContext(ThemeContext);
  const handlePressAllScreens = useCallback(() => {
    navigation.push('all-streams');
  }, [navigation]);

  return (
    <Touchable onPress={handlePressAllScreens}>
      <View style={[appStyles.listItem, styles.allStreamsButton]}>
        <ZulipTextIntl style={styles.streamsText} text="All streams" />
        <IconRight size={24} style={[styles.rightIcon, { color: themeContext.color }]} />
      </View>
    </Touchable>
  );
}

export default function SubscriptionsScreen(props: Props): Node {
  const dispatch = useDispatch();
  const subscriptions = useSelector(getSubscriptions);
  const unreadByStream = useSelector(getUnreadByStream);

  const sections = useMemo(() => {
    const sortedSubscriptions = subscriptions
      .slice()
      .sort((a, b) => caseInsensitiveCompareFunc(a.name, b.name));
    return [
      { key: 'Pinned', data: sortedSubscriptions.filter(x => x.pin_to_top) },
      { key: 'Unpinned', data: sortedSubscriptions.filter(x => !x.pin_to_top) },
    ];
  }, [subscriptions]);

  const handleNarrow = useCallback(
    stream => dispatch(doNarrow(streamNarrow(stream.stream_id))),
    [dispatch],
  );

  return (
    <View style={styles.container}>
      <ModalNavBar canGoBack={false} title="Streams" />
      <LoadingBanner />
      {subscriptions.length === 0 ? (
        <SearchEmptyState text="No streams found" />
      ) : (
        <SectionList
          style={styles.list}
          sections={sections}
          extraData={unreadByStream}
          initialNumToRender={20}
          keyExtractor={item => item.stream_id}
          renderItem={({ item }: { item: Subscription, ... }) => (
            <StreamItem
              streamId={item.stream_id}
              name={item.name}
              iconSize={16}
              isPrivate={item.invite_only}
              isWebPublic={item.is_web_public}
              description=""
              color={item.color}
              unreadCount={unreadByStream[item.stream_id]}
              isMuted={item.in_home_view === false} // if 'undefined' is not muted
              offersSubscribeButton={false}
              // isSubscribed is ignored when offersSubscribeButton false
              onPress={handleNarrow}
            />
          )}
          SectionSeparatorComponent={SectionSeparatorBetween}
          ListFooterComponent={AllStreamsButton}
        />
      )}
    </View>
  );
}

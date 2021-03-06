import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'dva'
import { Row, Col, Card } from 'antd'
import { routerRedux } from 'dva/router'
import queryString from 'query-string'
import VolumeActions from '../VolumeActions'
import VolumeInfo from './VolumeInfo'
import styles from './index.less'
import AttachHost from '../AttachHost'
import EngineUpgrade from '../EngineUpgrade'
import UpdateReplicaCount from '../UpdateReplicaCount'
import Snapshots from './Snapshots'
import RecurringList from './RecurringList'
import CreatePVAndPVCSingle from '../CreatePVAndPVCSingle'
import ChangeVolumeModal from '../ChangeVolumeModal'
import Salvage from '../Salvage'
import { ReplicaList } from '../../../components'
import { genAttachHostModalProps, getEngineUpgradeModalProps, getUpdateReplicaCountModalProps } from '../helper'
import { addPrefix } from '../../../utils/pathnamePrefix'

function VolumeDetail({ snapshotModal, dispatch, backup, engineimage, host, volume, volumeId, loading }) {
  const { data, attachHostModalVisible, engineUpgradeModalVisible, salvageModalVisible, updateReplicaCountModalVisible, createPVAndPVCModalSingleKey, defaultPVName, defaultPVCName, pvNameDisabled, createPVAndPVCSingleVisible, selectPVCaction, nameSpaceDisabled, changeVolumeModalKey, changeVolumeActivate, changeVolumeModalVisible, previousChecked } = volume
  const { backupStatus } = backup
  const { data: snapshotData, state: snapshotModalState } = snapshotModal
  const hosts = host.data
  const engineImages = engineimage.data
  const selectedVolume = data.find(item => item.id === volumeId)
  if (!selectedVolume) {
    return (<div></div>)
  }
  const found = hosts.find(h => selectedVolume.controller && h.id === selectedVolume.controller.hostId)
  if (found) {
    selectedVolume.host = found.name
  }
  selectedVolume.replicas.forEach(replica => { replica.volState = selectedVolume.state })
  const replicaListProps = {
    dataSource: selectedVolume.replicas || [],
    purgeStatus: selectedVolume.purgeStatus || [],
    restoreStatus: selectedVolume.restoreStatus || [],
    hosts,
    deleteReplicas(replicas) {
      replicas.forEach(replica => { replica.removeUrl = selectedVolume.actions.replicaRemove })
      if (selectedVolume.actions.replicaRemove) {
        dispatch({
          type: 'volume/deleteReplicas',
          replicas,
        })
      }
    },
    loading,
  }

  const backupStatusProps = {
    selectedVolume,
    backupStatus,
    snapshotData,
    snapshotModalState,
    engineImages,
    clearBackupStatus() {
      dispatch({
        type: 'backup/updateBackupStatus',
        payload: {
          backupStatus: {},
        },
      })
    },
    queryBackupStatus() {
      dispatch({
        type: 'backup/queryBackupStatus',
        payload: {
          url: selectedVolume.actions.latestBackupStatus,
        },
      })
    },
  }

  const volumeActionsProps = {
    engineImages,
    takeSnapshot(record) {
      dispatch({
        type: 'snapshotModal/snapshotAction',
        payload: {
          type: 'snapshotCreate',
          url: record.actions.snapshotCreate,
          params: {
            name: '',
          },
          querySnapShotUrl: record.actions.snapshotList,
        },
      })
    },
    showAttachHost(record) {
      dispatch({
        type: 'volume/showAttachHostModal',
        payload: {
          selected: record,
        },
      })
    },
    showSnapshots(record) {
      dispatch(routerRedux.push({
        pathname: addPrefix(`/volume/${record.name}/snapshots`),
      }))
    },
    showRecurring(record) {
      dispatch({
        type: 'volume/showRecurringModal',
        payload: {
          selected: record,
        },
      })
    },
    deleteVolume(record) {
      dispatch({
        type: 'volume/deleteAndRedirect',
        payload: record,
      })
    },
    detach(url) {
      dispatch({
        type: 'volume/detach',
        payload: {
          url,
        },
      })
    },
    showEngineUpgrade(record) {
      dispatch({
        type: 'volume/showEngineUpgradeModal',
        payload: {
          selected: record,
        },
      })
    },
    showBackups(record) {
      dispatch(routerRedux.push({
        pathname: addPrefix(`/backup/${record.name}`),
        search: queryString.stringify({
          field: 'volumeName',
          keyword: record.name,
        }),
        state: true,
      }))
    },
    showSalvage(record) {
      dispatch({
        type: 'volume/showSalvageModal',
        payload: {
          selected: record,
        },
      })
    },
    rollback(record) {
      dispatch({
        type: 'volume/rollback',
        payload: {
          image: record.currentImage,
          url: record.actions.engineUpgrade,
        },
      })
    },
    showUpdateReplicaCount(record) {
      dispatch({
        type: 'volume/showUpdateReplicaCountModal',
        payload: {
          selected: record,
        },
      })
    },
    createPVAndPVC(actions) {
      dispatch({
        type: 'volume/showCreatePVCAndPVSingleModal',
        payload: actions,
      })
    },
    changeVolume(record) {
      dispatch({
        type: 'volume/showChangeVolumeModal',
        payload: record.actions.activate,
      })
    },
  }

  const attachHostModalProps = genAttachHostModalProps([selectedVolume], hosts, attachHostModalVisible, dispatch)

  const engineUpgradeModalProps = getEngineUpgradeModalProps([selectedVolume], engineImages, engineUpgradeModalVisible, dispatch)

  const recurringListProps = {
    selectedVolume,
    dataSourceReplicas: selectedVolume.replicas || [],
    dataSource: selectedVolume.recurringJobs || [],
    loading,
    onOk(recurring) {
      dispatch({
        type: 'volume/recurringUpdate',
        payload: {
          recurring,
          url: selectedVolume.actions.recurringUpdate,
        },
      })
    },
  }

  const snapshotsProp = {
    ...snapshotModal,
    selectedVolume,
    volume: selectedVolume,
    volumeId,
    dispatch,
    volumeHead: snapshotData.find(d => d.name === 'volume-head'),
  }

  const salvageModalProps = {
    item: selectedVolume,
    visible: salvageModalVisible,
    hosts,
    onOk(replicaNames, url) {
      dispatch({
        type: 'volume/salvage',
        payload: {
          replicaNames,
          url,
        },
      })
    },
    onCancel() {
      dispatch({
        type: 'volume/hideSalvageModal',
      })
      dispatch({
        type: 'app/changeBlur',
        payload: false,
      })
    },
  }

  const bodyStyle = {
    bodyStyle: {
      height: 360,
      background: '#fff',
      overflowY: 'auto',
    },
  }

  const updateReplicaCountModalProps = getUpdateReplicaCountModalProps(selectedVolume, updateReplicaCountModalVisible, dispatch)

  const createPVAndPVCSingleProps = {
    item: {
      defaultPVName,
      defaultPVCName,
      pvNameDisabled,
    },
    selected: selectedVolume.kubernetesStatus ? selectedVolume.kubernetesStatus : {},
    visible: createPVAndPVCSingleVisible,
    nameSpaceDisabled,
    previousChecked,
    onOk(params) {
      dispatch({
        type: 'volume/createPVAndPVCSingle',
        payload: {
          action: selectPVCaction,
          params,
        },
      })
    },
    onCancel() {
      dispatch({
        type: 'volume/hideCreatePVCAndPVSingleModal',
      })
    },
    onChange() {
      dispatch({
        type: 'volume/changeCheckbox',
      })
    },
    setPreviousChange(checked) {
      dispatch({
        type: 'volume/setPreviousChange',
        payload: checked,
      })
    },
  }

  const changeVolumeModalProps = {
    item: {
      frontend: 'iscsi',
    },
    hosts,
    visible: changeVolumeModalVisible,
    onOk(newVolume) {
      let volumeData = Object.assign(newVolume, { url: changeVolumeActivate })
      dispatch({
        type: 'volume/volumeActivate',
        payload: volumeData,
      })
    },
    onCancel() {
      dispatch({
        type: 'volume/hideChangeVolumeModal',
      })
    },
  }

  return (
    <div style={{ overflowY: 'auto', overflowX: 'hidden', height: '100%' }}>
      <Row gutter={24}>
        <Col md={{ offset: 16, span: 8 }} style={{ marginBottom: 16, textAlign: 'right' }}>
          <VolumeActions {...volumeActionsProps} selected={selectedVolume} />
        </Col>
        <Col md={8} xs={24} className={styles.col}>
          <Card title="Volume Details" bordered={false} {...bodyStyle}>
            <VolumeInfo {...backupStatusProps} />
          </Card>
        </Col>
        <Col md={16} xs={24} style={{ marginBottom: 16 }}>
          <Card title="Replicas" bordered={false} {...bodyStyle}>
            <ReplicaList {...replicaListProps} />
          </Card>
        </Col>
        <Col xs={24} style={{ marginBottom: 16 }}>
          <Snapshots {...snapshotsProp} />
        </Col>
        <Col xs={24}>
          <RecurringList {...recurringListProps} />
        </Col>
      </Row>
      {attachHostModalVisible && <AttachHost {...attachHostModalProps} />}
      {engineUpgradeModalVisible && <EngineUpgrade {...engineUpgradeModalProps} />}
      {updateReplicaCountModalVisible && <UpdateReplicaCount {...updateReplicaCountModalProps} />}
      <Salvage {...salvageModalProps} />
      <ChangeVolumeModal key={changeVolumeModalKey} {...changeVolumeModalProps} />
      <CreatePVAndPVCSingle key={createPVAndPVCModalSingleKey} {...createPVAndPVCSingleProps} />
    </div>
  )
}

VolumeDetail.propTypes = {
  volume: PropTypes.object,
  location: PropTypes.object,
  dispatch: PropTypes.func,
  backup: PropTypes.object,
  host: PropTypes.object,
  engineimage: PropTypes.object,
  volumeId: PropTypes.string,
  loading: PropTypes.bool,
  snapshotModal: PropTypes.object,
}

export default connect(({ snapshotModal, backup, host, engineimage, volume, loading }, { match }) => ({ snapshotModal, backup, host, volume, engineimage, loading: loading.models.volume, volumeId: match.params.id }))(VolumeDetail)

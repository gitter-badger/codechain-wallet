import {
    PendingTransactionDoc,
    TransactionDoc
} from "codechain-indexer-types/lib/types";
import { H256 } from "codechain-sdk/lib/core/classes";
import * as _ from "lodash";
import * as React from "react";
import { connect } from "react-redux";
import { Action } from "redux";
import { ThunkDispatch } from "redux-thunk";
import { NetworkId } from "../../model/address";
import { ReducerConfigure } from "../../redux";
import chainActions from "../../redux/chain/chainActions";
import { getIdByAddressAssetType } from "../../redux/chain/chainReducer";
import * as Empty from "./img/cautiondisabled.svg";
import "./TxHistory.css";
import TxItem from "./TxItem/TxItem";

interface OwnProps {
    address: string;
    assetType?: H256;
}

interface StateProps {
    pendingTxList?: PendingTransactionDoc[] | null;
    txList?: TransactionDoc[] | null;
    bestBlockNumber?: number | null;
    networkId: NetworkId;
}

interface DispatchProps {
    fetchPendingTxListIfNeed: (address: string) => void;
    fetchTxListIfNeed: (address: string) => void;
    fetchBestBlockNumberIfNeed: () => void;
    fetchTxListByAssetTypeIfNeed: (address: string, assetType: H256) => void;
}

type Props = StateProps & OwnProps & DispatchProps;

class TxHistory extends React.Component<Props> {
    public constructor(props: Props) {
        super(props);
        this.state = {
            pendingTxList: undefined,
            txList: undefined,
            bestBlockNumber: undefined
        };
    }

    public componentDidMount() {
        this.init();
    }

    public render() {
        const {
            pendingTxList,
            txList,
            bestBlockNumber,
            address,
            networkId
        } = this.props;
        if (!pendingTxList || !txList || !bestBlockNumber) {
            return <div>Loading...</div>;
        }
        const txHashList = _.map(txList, tx => tx.data.hash);
        const validPendingTxList = _.filter(
            pendingTxList,
            pendingTx =>
                !_.includes(txHashList, pendingTx.transaction.data.hash)
        );
        return (
            <div className="Tx-history">
                {validPendingTxList.length + txList.length === 0 && (
                    <div className="d-flex align-items-center justify-content-center">
                        <div>
                            <div className="text-center mt-3">
                                <img src={Empty} />
                            </div>
                            <div className="mt-3 empty">
                                There is no transaction
                            </div>
                        </div>
                    </div>
                )}
                {_.map(validPendingTxList, pendingTx => (
                    <TxItem
                        key={pendingTx.transaction.data.hash}
                        tx={pendingTx.transaction}
                        bestBlockNumber={bestBlockNumber}
                        address={address}
                        networkId={networkId}
                        isPending={true}
                        timestamp={pendingTx.timestamp}
                    />
                ))}
                {_.map(txList, tx => (
                    <TxItem
                        key={tx.data.hash}
                        tx={tx}
                        address={address}
                        bestBlockNumber={bestBlockNumber}
                        networkId={networkId}
                        isPending={false}
                        timestamp={tx.data.timestamp}
                    />
                ))}
            </div>
        );
    }

    private init = async () => {
        this.fetchAll();
    };

    private fetchAll = () => {
        const {
            address,
            fetchBestBlockNumberIfNeed,
            fetchPendingTxListIfNeed,
            fetchTxListIfNeed,
            assetType,
            fetchTxListByAssetTypeIfNeed
        } = this.props;
        fetchBestBlockNumberIfNeed();
        fetchPendingTxListIfNeed(address);

        if (assetType) {
            fetchTxListByAssetTypeIfNeed(address, assetType);
        } else {
            fetchTxListIfNeed(address);
        }
    };
}

const mapStateToProps = (state: ReducerConfigure, props: OwnProps) => {
    const { address, assetType } = props;
    const pendingTxList = state.chainReducer.pendingTxList[address];
    const txList = assetType
        ? state.chainReducer.txListById[
              getIdByAddressAssetType(address, assetType)
          ]
        : state.chainReducer.txList[address];
    const bestBlockNumber = state.chainReducer.bestBlockNumber;
    const networkId = state.globalReducer.networkId;
    return {
        pendingTxList: pendingTxList && pendingTxList.data,
        txList: txList && txList.data,
        bestBlockNumber: bestBlockNumber && bestBlockNumber.data,
        networkId
    };
};
const mapDispatchToProps = (
    dispatch: ThunkDispatch<ReducerConfigure, void, Action>
) => ({
    fetchPendingTxListIfNeed: (address: string) => {
        dispatch(chainActions.fetchPendingTxListIfNeed(address));
    },
    fetchTxListIfNeed: (address: string) => {
        dispatch(chainActions.fetchTxListIfNeed(address));
    },
    fetchBestBlockNumberIfNeed: () => {
        dispatch(chainActions.fetchBestBlockNumberIfNeed());
    },
    fetchTxListByAssetTypeIfNeed: (address: string, assetType: H256) => {
        dispatch(chainActions.fetchTxListByAssetTypeIfNeed(address, assetType));
    }
});
export default connect(
    mapStateToProps,
    mapDispatchToProps
)(TxHistory);

import React, { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract } from 'wagmi';
import { formatUnits } from 'viem';
import SBTArtifact from '../contracts/SBT.json';
import WalletConnectButton from '../components/WalletConnectButton';

function SBT() {
  const { address, isConnected, chain } = useAccount();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState({ message: '', type: '' });
  const [loading, setLoading] = useState(false);
  const [ownedSBT, setOwnedSBT] = useState(null);
  const [imageError, setImageError] = useState(false);
  const [loadingMetadata, setLoadingMetadata] = useState(false);
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  
  // 合约地址 - 部署后需要修改
  const sbtAddress = '0x519f46ae0962abe5BF3516B225c3181914A3F735';
  
  // 默认图片和备用图片
  const defaultImage = 'https://outside-orange-parrot.myfilebase.com/ipfs/QmP6ByefbSrofsbwF2FB2fmaYP836C6vnbSAUAferB8uUt';
  const fallbackImage = 'https://outside-orange-parrot.myfilebase.com/ipfs/QmP6ByefbSrofsbwF2FB2fmaYP836C6vnbSAUAferB8uUt';
  
  // 读取铸造价格
  const { data: mintPrice } = useReadContract({
    address: sbtAddress,
    abi: SBTArtifact.abi,
    functionName: 'mintPrice',
    enabled: isConnected,
  });

  // 读取用户余额
  const { data: tokenBalance, refetch: refetchBalance } = useReadContract({
    address: sbtAddress,
    abi: SBTArtifact.abi,
    functionName: 'balanceOf',
    args: [address],
    enabled: !!address && isConnected,
  });

  // 获取用户的SBT
  const { data: tokenId, refetch: refetchTokenId } = useReadContract({
    address: sbtAddress,
    abi: SBTArtifact.abi,
    functionName: 'tokenOfOwnerByIndex',
    args: [address, 0],
    enabled: !!address && isConnected && tokenBalance > 0n,
  });

  // 获取SBT的URI
  const { data: tokenURI, refetch: refetchTokenURI } = useReadContract({
    address: sbtAddress,
    abi: SBTArtifact.abi,
    functionName: 'tokenURI',
    args: [tokenId],
    enabled: !!tokenId,
  });

  // 重新加载SBT数据
  const refreshSBTData = async () => {
    if (!isConnected || !address) return;
    
    try {
      await refetchBalance();
      if (tokenBalance > 0n) {
        await refetchTokenId();
        if (tokenId) {
          await refetchTokenURI();
        }
      }
    } catch (error) {
      console.error("刷新SBT数据失败:", error);
    }
  };

  // 处理SBT元数据
  useEffect(() => {
    const fetchMetadata = async () => {
      if (!tokenURI) return;
      
      setLoadingMetadata(true);
      console.log("开始获取元数据，URI:", tokenURI);

      try {
        let metadata;
        if (tokenURI.startsWith('data:')) {
          // 处理 data URI
          try {
            const jsonStr = decodeURIComponent(tokenURI.split(',')[1]);
            metadata = JSON.parse(jsonStr);
            console.log("从data URI解析的元数据:", metadata);
          } catch (error) {
            console.error("解析data URI失败:", error);
          }
        } else if (tokenURI.startsWith('ipfs://')) {
          // 处理 IPFS URI
          const ipfsHash = tokenURI.replace('ipfs://', '');
          const ipfsUrl = `https://outside-orange-parrot.myfilebase.com/ipfs/QmP6ByefbSrofsbwF2FB2fmaYP836C6vnbSAUAferB8uUt`;
          console.log("尝试从IPFS获取元数据:", ipfsUrl);
          
          try {
            const response = await fetch(ipfsUrl);
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            metadata = await response.json();
            console.log("从IPFS获取的元数据:", metadata);
          } catch (error) {
            console.error("获取IPFS元数据失败:", error);
            // 如果IPFS获取失败，使用默认元数据
            metadata = {
              name: 'Mytestbct SBT #' + tokenId,
              description: '这是一个不可转让的灵魂绑定代币',
              image: defaultImage
            };
          }
        } else {
          // 尝试直接获取URI
          try {
            console.log("尝试直接获取URI:", tokenURI);
            const response = await fetch(tokenURI);
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            metadata = await response.json();
            console.log("直接获取的元数据:", metadata);
          } catch (error) {
            console.error("直接获取元数据失败:", error);
          }
        }
        
        if (!metadata) {
          // 如果无法获取元数据，使用默认值
          metadata = {
            name: 'Mytestbct SBT #' + tokenId,
            description: '这是一个不可转让的灵魂绑定代币',
            image: defaultImage
          };
          console.log("使用默认元数据:", metadata);
        }
        
        // 处理图片URL
        let imageUrl = metadata.image;
        if (imageUrl && imageUrl.startsWith('ipfs://')) {
          const ipfsHash = imageUrl.replace('ipfs://', '');
          imageUrl = `https://outside-orange-parrot.myfilebase.com/ipfs/QmP6ByefbSrofsbwF2FB2fmaYP836C6vnbSAUAferB8uUt`;
          console.log("转换后的图片URL:", imageUrl);
        }
        
        setOwnedSBT({
          id: tokenId.toString(),
          uri: tokenURI,
          image: imageUrl || defaultImage,
          name: metadata?.name || 'Mytestbct SBT #' + tokenId,
          description: metadata?.description || '这是一个不可转让的灵魂绑定代币'
        });
        
        // 重置图片错误状态
        setImageError(false);
      } catch (error) {
        console.error("处理元数据失败:", error);
        // 处理失败时设置默认SBT数据
        setOwnedSBT({
          id: tokenId.toString(),
          uri: tokenURI,
          image: defaultImage,
          name: 'Mytestbct SBT #' + tokenId,
          description: '这是一个不可转让的灵魂绑定代币'
        });
      } finally {
        setLoadingMetadata(false);
      }
    };

    fetchMetadata();
  }, [tokenURI, tokenId, defaultImage]);

  // 铸造后刷新数据
  useEffect(() => {
    if (isConnected && address) {
      refreshSBTData();
    }
  }, [isConnected, address]);

  // 写入合约函数
  const { writeContract } = useWriteContract();

  // 铸造SBT
  const mintSBT = async () => {
    if (!isConnected) {
      setStatus({ message: '请先连接钱包', type: 'error' });
      return;
    }
    
    setLoading(true);
    setStatus({ message: '准备铸造SBT...', type: 'info' });
    
    try {
      // 创建元数据
      const metadata = {
        name: name || 'Mytestbct SBT',
        description: description || '这是一个SBT代币',
        image: defaultImage
      };
      
      console.log("准备铸造SBT，元数据:", metadata);
      console.log("铸造价格:", mintPrice ? formatUnits(mintPrice, 18) : '0', "AVAX");
      
      // 在实际应用中，应该将元数据上传到IPFS
      const metadataURI = `data:application/json,${encodeURIComponent(JSON.stringify(metadata))}`;
      console.log("元数据URI:", metadataURI);
      
      // 铸造SBT
      writeContract(
        {
          address: sbtAddress,
          abi: SBTArtifact.abi,
          functionName: 'mintWithPayment',
          args: [metadataURI],
          value: mintPrice,
        },
        {
          onSuccess: (hash) => {
            console.log("铸造交易已提交，交易哈希:", hash);
            setStatus({ message: 'SBT铸造成功！交易哈希: ' + hash.substring(0, 10) + '...', type: 'success' });
            // 延迟刷新数据，等待区块确认
            setTimeout(() => {
              refreshSBTData();
            }, 2000);
          },
          onError: (error) => {
            console.error("铸造失败:", error);
            console.error("错误详情:", JSON.stringify(error, null, 2));
            
            if (error.message.includes("insufficient funds")) {
              setStatus({ message: '余额不足，请确保有足够的 AVAX', type: 'error' });
            } else if (error.message.includes("user rejected")) {
              setStatus({ message: '用户取消了交易', type: 'error' });
            } else {
              setStatus({ message: '铸造失败: ' + error.message, type: 'error' });
            }
          },
          onSettled: () => {
            setLoading(false);
          }
        }
      );
    } catch (error) {
      console.error("铸造过程中发生错误:", error);
      setStatus({ message: '铸造过程中发生错误: ' + error.message, type: 'error' });
      setLoading(false);
    }
  };
  
  const handleImageError = () => {
    console.log("图片加载失败，使用备用图片");
    setImageError(true);
  };
  
  return (
    <div className="page-container sbt-container">
      <h1 className="page-title">Mytestbct SBT - 灵魂绑定代币</h1>
      
      {!isConnected ? (
        <div className="card">
          <div className="connect-wallet-section" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <p>请先连接钱包以使用SBT功能</p>
            <WalletConnectButton />
          </div>
        </div>
      ) : (
        <>
          <div className="sbt-grid">
            {/* 左侧：铸造表单 */}
            <div className="card sbt-form">
              <h2>铸造SBT</h2>
              <p>当前余额: {tokenBalance?.toString() || '0'} MSTB</p>
              <p>铸造价格: {mintPrice ? formatUnits(mintPrice, 18) : '0'} MSTB</p>
              
              <div className="form-group">
                <label className="form-label">名称</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  placeholder="输入SBT名称"
                  disabled={tokenBalance > 0n || loading}
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">描述</label>
                <textarea 
                  className="form-input" 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)} 
                  placeholder="输入SBT描述"
                  rows="4"
                  disabled={tokenBalance > 0n || loading}
                ></textarea>
              </div>
              
              <button 
                className="primary-btn" 
                onClick={mintSBT}
                disabled={loading || tokenBalance > 0n}
                style={{
                  backgroundColor: tokenBalance > 0n ? '#ccc' : loading ? '#1677ff80' : '#1677ff',
                  cursor: tokenBalance > 0n || loading ? 'not-allowed' : 'pointer',
                  padding: '10px 20px',
                  borderRadius: '4px',
                  border: 'none',
                  color: 'white',
                  fontWeight: 'bold',
                  width: '100%',
                  marginTop: '10px'
                }}
              >
                {loading ? "处理中..." : tokenBalance > 0n ? "已拥有SBT" : "铸造SBT"}
              </button>
              
              {status.message && (
                <div className={`status-message status-${status.type}`} style={{ 
                  marginTop: '15px', 
                  padding: '10px', 
                  borderRadius: '4px', 
                  backgroundColor: status.type === 'error' ? '#fff2f0' : status.type === 'success' ? '#f6ffed' : '#e6f7ff',
                  color: status.type === 'error' ? '#ff4d4f' : status.type === 'success' ? '#52c41a' : '#1677ff'
                }}>
                  {status.message}
                </div>
              )}
            </div>
            
            {/* 右侧：SBT展示 */}
            <div className="card sbt-gallery">
              <h2>我的SBT</h2>
              
              {loadingMetadata ? (
                <div className="loading-container">
                  <p>加载SBT数据中...</p>
                </div>
              ) : ownedSBT ? (
                <div className="sbt-card">
                  <img 
                    src={imageError ? fallbackImage : ownedSBT.image} 
                    alt="SBT" 
                    className="sbt-image"
                    onError={handleImageError}
                    style={{ maxWidth: '100%', height: 'auto' }}
                  />
                  <div className="sbt-info">
                    <h3 className="sbt-title">{ownedSBT.name}</h3>
                    <p>{ownedSBT.description}</p>
                    <p className="sbt-address">Token ID: {ownedSBT.id}</p>
                    <p className="sbt-address">绑定地址: {address}</p>
                  </div>
                  <button 
                    className="secondary-btn" 
                    onClick={refreshSBTData}
                    style={{ marginTop: '16px' }}
                  >
                    刷新SBT数据
                  </button>
                </div>
              ) : (
                <p>你还没有SBT，请在左侧铸造</p>
              )}
            </div>
          </div>
          
          {/* 调试信息面板 */}
          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <button 
              onClick={() => setShowDebugInfo(!showDebugInfo)}
              style={{ 
                background: 'none', 
                border: 'none', 
                color: '#1677ff', 
                cursor: 'pointer', 
                fontSize: '12px',
                textDecoration: 'underline'
              }}
            >
              {showDebugInfo ? '隐藏调试信息' : '显示调试信息'}
            </button>
            
            {showDebugInfo && (
              <div style={{ 
                marginTop: '10px', 
                padding: '15px', 
                backgroundColor: '#f5f5f5', 
                borderRadius: '4px', 
                fontSize: '12px',
                textAlign: 'left'
              }}>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '14px' }}>调试信息</h3>
                <p><strong>网络信息:</strong> {chain ? `${chain.name} (ID: ${chain.id})` : '未连接'}</p>
                <p><strong>当前钱包地址:</strong> {address || '未连接'}</p>
                <p><strong>SBT合约地址:</strong> {sbtAddress}</p>
                <p><strong>铸造价格:</strong> {mintPrice ? formatUnits(mintPrice, 18) : '0'} MSTB</p>
                <p><strong>代币余额:</strong> {tokenBalance?.toString() || '0'} MSTB</p>
                
                {ownedSBT && (
                  <>
                    <p><strong>拥有的SBT ID:</strong> {ownedSBT.id}</p>
                    <p><strong>SBT URI:</strong> {ownedSBT.uri}</p>
                    <p><strong>SBT 图片URL:</strong> {ownedSBT.image}</p>
                  </>
                )}
                
                <div style={{ marginTop: '10px' }}>
                  <p><strong>可能的问题:</strong></p>
                  <ul style={{ paddingLeft: '20px', margin: '5px 0' }}>
                    <li>确保钱包已连接到正确的网络 (Avalanche 测试网)</li>
                    <li>确保钱包中有足够的MSTB支付铸造费用</li>
                    <li>如果表单输入被禁用，可能是因为您已经拥有SBT</li>
                    <li>如果图片无法显示，可能是IPFS网关问题</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default SBT;

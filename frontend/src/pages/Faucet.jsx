import React, { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWatchContractEvent } from 'wagmi';
import { formatUnits, parseUnits } from 'viem';
import FaucetArtifact from '../contracts/Faucet.json';
import CustomFaucetABI from '../contracts/CustomFaucet';
import WalletConnectButton from '../components/WalletConnectButton';

function Faucet() {
  const { address, isConnected, chain } = useAccount();
  const [tokenAddress, setTokenAddress] = useState(null);
  const [tokenBalance, setTokenBalance] = useState('0');
  const [faucetBalance, setFaucetBalance] = useState('0');
  const [status, setStatus] = useState({ message: '', type: '' });
  const [loading, setLoading] = useState(false);
  const [returnLoading, setReturnLoading] = useState(false);
  const [loadingBalances, setLoadingBalances] = useState(false);
  const [amountAllowedValue, setAmountAllowedValue] = useState('0');
  const [errorInfo, setErrorInfo] = useState('');
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [customRpcUrl, setCustomRpcUrl] = useState('');
  const [actualRpcUrl, setActualRpcUrl] = useState('');
  
  // 新增弹窗状态
  const [showModal, setShowModal] = useState(false);
  const [recipientAddress, setRecipientAddress] = useState('');
  
  // 合约地址 - 部署合约后需要修改
  // 注意：请将此地址更新为新部署的Faucet合约地址
  const faucetAddress = '0xe45eFf7a6889893E166a0Dd84bfAa95ad9d04D64';
  
  // 显示当前网络和连接信息
  useEffect(() => {
    if (isConnected && chain) {
      console.log("当前连接的网络:", chain.name, "ID:", chain.id);
      console.log("当前连接的钱包地址:", address);
      const rpcUrl = chain.rpcUrls?.default?.http?.[0] || "未知";
      console.log("当前使用的RPC URL:", rpcUrl);
      setActualRpcUrl(rpcUrl);
    }
  }, [isConnected, chain, address]);
  
  // 读取代币合约地址
  const { data: tokenContractAddress, refetch: refetchTokenContract, isError: tokenContractError, error: tokenContractErrorData } = useReadContract({
    address: faucetAddress,
    abi: FaucetArtifact.abi,
    functionName: 'tokenContract',
    enabled: isConnected,
    onError: (error) => {
      console.error("获取代币合约地址错误:", error);
      console.error("错误详情:", JSON.stringify(error, null, 2));
      
      if (error.message && error.message.includes("[object Object]")) {
        setErrorInfo(`RPC URL格式错误: 检测到URL为[object Object]，这表明RPC URL配置有问题。
请检查Web3Provider.jsx中的RPC URL配置，确保使用的是字符串而不是对象。
完整错误: ${error.message}`);
      } else if (error.message && error.message.includes("404")) {
        setErrorInfo(`RPC连接错误(404): 请确认本地Avalanche节点是否正在运行，以及RPC URL是否正确配置。
子链ID: h2BZHAsqc5c1af6dAHzMHYS5NGmHGmRhUZr9QtaVFXzDqtETu
RPC URL: http://127.0.0.1:38561/ext/bc/h2BZHAsqc5c1af6dAHzMHYS5NGmHGmRhUZr9QtaVFXzDqtETu/rpc
Faucet合约地址: ${faucetAddress}
完整错误: ${error.message}`);
      } else if (error.message && error.message.includes("execution reverted")) {
        setErrorInfo(`合约执行错误: 调用tokenContract函数失败。可能Faucet合约地址不正确或合约不存在。
Faucet合约地址: ${faucetAddress}
完整错误: ${error.message}`);
      } else {
        setErrorInfo(`获取代币合约地址错误: ${error?.message || JSON.stringify(error)}`);
      }
    }
  });

  // 设置代币合约地址
  useEffect(() => {
    if (tokenContractAddress) {
      setTokenAddress(tokenContractAddress);
      console.log("代币合约地址:", tokenContractAddress);
    } else if (tokenContractError) {
      console.error("获取代币合约地址失败:", tokenContractErrorData);
      setStatus({ message: '获取代币合约地址失败，请检查网络连接', type: 'error' });
      setErrorInfo(`获取代币合约地址错误: ${tokenContractErrorData?.message || '未知错误'}`);
    }
  }, [tokenContractAddress, tokenContractError, tokenContractErrorData]);

  // 读取代币精度
  const { data: decimals, refetch: refetchDecimals, isError: decimalsError, error: decimalsErrorData } = useReadContract({
    address: tokenAddress,
    abi: [
      {
        name: 'decimals',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ name: '', type: 'uint8' }]
      }
    ],
    functionName: 'decimals',
    enabled: !!tokenAddress && isConnected,
  });

  // 读取代币名称
  const { data: tokenName, refetch: refetchName } = useReadContract({
    address: tokenAddress,
    abi: [
      {
        name: 'name',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ name: '', type: 'string' }]
      }
    ],
    functionName: 'name',
    enabled: !!tokenAddress && isConnected,
  });

  // 读取代币符号
  const { data: tokenSymbol, refetch: refetchSymbol } = useReadContract({
    address: tokenAddress,
    abi: [
      {
        name: 'symbol',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ name: '', type: 'string' }]
      }
    ],
    functionName: 'symbol',
    enabled: !!tokenAddress && isConnected,
  });

  // 读取用户余额
  const { data: userBalance, refetch: refetchUserBalance, isError: userBalanceError, error: userBalanceErrorData } = useReadContract({
    address: tokenAddress,
    abi: [
      {
        name: 'balanceOf',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'account', type: 'address' }],
        outputs: [{ name: 'balance', type: 'uint256' }]
      }
    ],
    functionName: 'balanceOf',
    args: [address],
    enabled: !!tokenAddress && !!address && isConnected,
  });

  // 读取Faucet合约余额
  const { data: contractBalance, refetch: refetchContractBalance, isError: contractBalanceError, error: contractBalanceErrorData } = useReadContract({
    address: tokenAddress,
    abi: [
      {
        name: 'balanceOf',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'account', type: 'address' }],
        outputs: [{ name: 'balance', type: 'uint256' }]
      }
    ],
    functionName: 'balanceOf',
    args: [faucetAddress],
    enabled: !!tokenAddress && !!faucetAddress && isConnected,
  });

  // 读取发放金额
  const { data: amountAllowed, refetch: refetchAmountAllowed, isError: amountAllowedError, error: amountAllowedErrorData } = useReadContract({
    address: faucetAddress,
    abi: FaucetArtifact.abi,
    functionName: 'amountAllowed',
    enabled: isConnected,
  });

  // 刷新所有数据
  const refreshAllData = async () => {
    if (!isConnected) return;
    
    setLoadingBalances(true);
    console.log("刷新所有数据...");
    
    try {
      await refetchTokenContract();
      
      if (tokenAddress) {
        await refetchDecimals();
        await refetchName();
        await refetchSymbol();
        
        if (address) {
          await refetchUserBalance();
        }
        
        await refetchContractBalance();
        await refetchAmountAllowed();
      }
    } catch (error) {
      console.error("刷新数据失败:", error);
      setStatus({ message: '刷新数据失败，请稍后重试', type: 'error' });
      setErrorInfo(`刷新数据错误: ${error?.message || '未知错误'}`);
    } finally {
      setLoadingBalances(false);
    }
  };

  // 初始加载数据
  useEffect(() => {
    if (isConnected) {
      refreshAllData();
    }
  }, [isConnected, address, tokenAddress]);

  // 定期刷新数据
  useEffect(() => {
    let intervalId;
    
    if (isConnected && tokenAddress) {
      // 每30秒自动刷新一次数据
      intervalId = setInterval(() => {
        console.log("自动刷新数据...");
        refreshAllData();
      }, 30000);
    }
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isConnected, tokenAddress, address]);

  // 更新余额显示
  useEffect(() => {
    if (userBalance && decimals) {
      try {
        const formattedBalance = formatUnits(userBalance, decimals);
        setTokenBalance(formattedBalance);
        console.log("用户余额:", formattedBalance, tokenSymbol || "MTBT");
      } catch (error) {
        console.error("格式化用户余额失败:", error);
        setTokenBalance('0');
        setErrorInfo(`格式化用户余额错误: ${error?.message || '未知错误'}`);
      }
    } else if (userBalanceError) {
      console.error("获取用户余额失败:", userBalanceErrorData);
      setErrorInfo(`获取用户余额错误: ${userBalanceErrorData?.message || '未知错误'}`);
    }
    
    if (contractBalance && decimals) {
      try {
        const formattedBalance = formatUnits(contractBalance, decimals);
        setFaucetBalance(formattedBalance);
        console.log("Faucet合约余额:", formattedBalance, tokenSymbol || "MTBT");
      } catch (error) {
        console.error("格式化Faucet合约余额失败:", error);
        setFaucetBalance('0');
        setErrorInfo(`格式化Faucet合约余额错误: ${error?.message || '未知错误'}`);
      }
    } else if (contractBalanceError) {
      console.error("获取Faucet合约余额失败:", contractBalanceErrorData);
      setErrorInfo(`获取Faucet合约余额错误: ${contractBalanceErrorData?.message || '未知错误'}`);
    }
    
    if (amountAllowed && decimals) {
      try {
        const formattedAmount = formatUnits(amountAllowed, decimals);
        setAmountAllowedValue(formattedAmount);
        console.log("每次发放金额:", formattedAmount, tokenSymbol || "MTBT");
      } catch (error) {
        console.error("格式化发放金额失败:", error);
        setAmountAllowedValue('0');
        setErrorInfo(`格式化发放金额错误: ${error?.message || '未知错误'}`);
      }
    } else if (amountAllowedError) {
      console.error("获取发放金额失败:", amountAllowedErrorData);
      setErrorInfo(`获取发放金额错误: ${amountAllowedErrorData?.message || '未知错误'}`);
    }
  }, [
    userBalance, userBalanceError, userBalanceErrorData,
    contractBalance, contractBalanceError, contractBalanceErrorData,
    amountAllowed, amountAllowedError, amountAllowedErrorData,
    decimals, decimalsError, decimalsErrorData,
    tokenSymbol
  ]);
          
          // 监听 SendToken 事件
  useWatchContractEvent({
    address: faucetAddress,
    abi: FaucetArtifact.abi,
    eventName: 'SendToken',
    onLogs: (logs) => {
      console.log("收到SendToken事件:", logs);
      refreshAllData();
    },
          });
          
          // 监听 ReturnToken 事件
  useWatchContractEvent({
    address: faucetAddress,
    abi: FaucetArtifact.abi,
    eventName: 'ReturnToken',
    onLogs: (logs) => {
      console.log("收到ReturnToken事件:", logs);
      refreshAllData();
    },
  });

  // 写入合约函数
  const { writeContract, isPending, error: writeError } = useWriteContract();

  // 显示写入合约错误
  useEffect(() => {
    if (writeError) {
      console.error("写入合约错误:", writeError);
      setErrorInfo(`写入合约错误: ${writeError.message || '未知错误'}`);
    }
  }, [writeError]);

  // 打开领取代币弹窗
  const openClaimModal = () => {
    setRecipientAddress(address || '');
    setShowModal(true);
  };

  // 领取代币
  const claimTokens = async () => {
    if (!isConnected) {
      setStatus({ message: '请先连接钱包', type: 'error' });
      return;
    }
    
    if (!tokenAddress) {
      setStatus({ message: '无法获取代币合约地址', type: 'error' });
      return;
    }
    
    // 验证地址格式
    if (!recipientAddress || !/^0x[a-fA-F0-9]{40}$/.test(recipientAddress)) {
      setStatus({ message: '请输入有效的钱包地址', type: 'error' });
      return;
    }
    
    setLoading(true);
    setStatus({ message: '处理中...', type: 'info' });
    setErrorInfo('');
    setShowModal(false);
    
    console.log("开始领取代币，合约地址:", faucetAddress, "接收地址:", recipientAddress);
    
    try {
      // 使用requestTokensTo函数
      writeContract(
        {
          address: faucetAddress,
          abi: CustomFaucetABI,
          functionName: 'requestTokensTo',
          args: [recipientAddress],
        },
        {
          onSuccess: (hash) => {
            console.log("领取交易已提交，交易哈希:", hash);
            setStatus({ message: `领取请求已提交，交易哈希: ${hash.slice(0, 10)}...，等待确认...`, type: 'info' });
            
            // 延迟刷新数据，等待交易确认
            const checkInterval = setInterval(() => {
              console.log("检查交易状态...");
              refreshAllData();
              
              // 10秒后停止检查并显示最终状态
              setTimeout(() => {
                clearInterval(checkInterval);
                setStatus({ message: '领取成功！请在钱包中查看', type: 'success' });
                setLoading(false);
              }, 10000);
            }, 2000);
          },
          onError: (error) => {
            console.error("领取失败:", error);
            
            // 详细的错误处理
            if (error.message?.includes("user rejected transaction")) {
              setStatus({ message: '用户取消了交易', type: 'error' });
            } else if (error.message?.includes("Faucet Empty")) {
              setStatus({ message: 'Faucet代币余额不足', type: 'error' });
            } else if (error.message?.includes("execution reverted")) {
              setStatus({ message: '交易被拒绝，可能Faucet余额不足或其他原因', type: 'error' });
            } else if (error.message?.includes("function selector was not recognized")) {
              console.log("尝试使用原始requestTokens函数...");
              
              // 尝试使用原始的requestTokens函数（不带地址参数）
              writeContract(
                {
                  address: faucetAddress,
                  abi: FaucetArtifact.abi,
                  functionName: 'requestTokens',
                },
                {
                  onSuccess: (hash) => {
                    console.log("领取交易已提交，交易哈希:", hash);
                    setStatus({ message: `领取请求已提交，交易哈希: ${hash.slice(0, 10)}...，等待确认...`, type: 'info' });
                    
                    // 延迟刷新数据，等待交易确认
                    const checkInterval = setInterval(() => {
                      console.log("检查交易状态...");
                      refreshAllData();
                      
                      // 10秒后停止检查并显示最终状态
                      setTimeout(() => {
                        clearInterval(checkInterval);
                        setStatus({ message: '领取成功！注意：只能发送到当前连接的钱包地址', type: 'success' });
                        setLoading(false);
                      }, 10000);
                    }, 2000);
                  },
                  onError: (fallbackError) => {
                    console.error("原始领取方法也失败:", fallbackError);
                    handleClaimError(fallbackError);
                  }
                }
              );
            } else {
              handleClaimError(error);
            }
          }
        }
      );
    } catch (error) {
      console.error("领取失败:", error);
      handleClaimError(error);
    }
  };
  
  // 处理领取错误的辅助函数
  const handleClaimError = (error) => {
    console.error("处理领取错误:", error);
    
    if (error.message?.includes("Faucet Empty")) {
      setStatus({ message: 'Faucet代币余额不足', type: 'error' });
    } else if (error.message?.includes("user rejected")) {
      setStatus({ message: '用户取消了交易', type: 'error' });
    } else if (error.message?.includes("nonce")) {
      setStatus({ message: '交易nonce错误，请刷新页面重试', type: 'error' });
    } else if (error.message?.includes("gas")) {
      setStatus({ message: '交易gas估算失败，可能合约执行会失败', type: 'error' });
    } else if (error.message?.includes("execution reverted")) {
      setStatus({ message: '交易执行被拒绝，请检查合约状态', type: 'error' });
    } else {
      setStatus({ message: '领取失败，请稍后重试', type: 'error' });
    }
    
    setErrorInfo(`领取失败: ${error.message || '未知错误'}`);
    setLoading(false);
  };

  // 返还代币
  const returnTokens = async () => {
    if (!isConnected || !tokenAddress) {
      setStatus({ message: '请先连接钱包', type: 'error' });
      return;
    }
    
    if (Number(tokenBalance) <= 0) {
      setStatus({ message: '您没有足够的代币可以返还', type: 'error' });
      return;
    }
    
    setReturnLoading(true);
    setStatus({ message: '处理中...', type: 'info' });
    setErrorInfo('');
    
    console.log("开始返还代币，代币合约:", tokenAddress, "Faucet合约:", faucetAddress);
    console.log("用户余额:", userBalance?.toString());
    
    try {
      // 先授权Faucet合约使用代币
      writeContract(
        {
          address: tokenAddress,
          abi: [
            {
              name: 'approve',
              type: 'function',
              stateMutability: 'nonpayable',
              inputs: [
                { name: 'spender', type: 'address' },
                { name: 'amount', type: 'uint256' }
              ],
              outputs: [{ name: '', type: 'bool' }]
            }
          ],
          functionName: 'approve',
          args: [faucetAddress, userBalance],
        },
        {
          onSuccess: (hash) => {
            console.log("授权交易已提交:", hash);
            setStatus({ message: '授权成功，正在返还...', type: 'info' });
      
      // 返还代币
            writeContract(
              {
                address: faucetAddress,
                abi: FaucetArtifact.abi,
                functionName: 'returnTokens',
              },
              {
                onSuccess: (hash) => {
                  console.log("返还交易已提交:", hash);
                  
                  // 延迟刷新数据，等待交易确认
                  setTimeout(() => {
                    refreshAllData();
      setStatus({ message: '返还成功！', type: 'success' });
                  }, 2000);
                },
                onError: (error) => {
                  console.error("返还失败:", error);
                  setStatus({ message: '返还失败', type: 'error' });
                  setErrorInfo(`返还失败: ${error.message || '未知错误'}`);
                },
                onSettled: () => {
                  setReturnLoading(false);
                }
              }
            );
          },
          onError: (error) => {
            console.error("授权失败:", error);
            setStatus({ message: '授权失败', type: 'error' });
            setErrorInfo(`授权失败: ${error.message || '未知错误'}`);
            setReturnLoading(false);
          }
        }
      );
    } catch (error) {
      console.error("返还失败:", error);
      setStatus({ message: '返还失败', type: 'error' });
      setErrorInfo(`返还失败: ${error.message || '未知错误'}`);
      setReturnLoading(false);
    }
  };
  
  return (
    <div className="page-container faucet-container">
      <h1 className="page-title">
        {tokenName ? `${tokenName} 水龙头` : "代币水龙头"}
      </h1>
      <div className="card">
        {!isConnected ? (
          <div className="connect-wallet-section" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <p>请先连接钱包以使用Faucet功能</p>
            <WalletConnectButton />
          </div>
        ) : (
          <>
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column',
              gap: '15px',
              marginBottom: '20px'
            }}>
              {/* 钱包信息 */}
              <div style={{ 
                padding: '15px 20px', 
                borderRadius: '8px', 
                border: '1px solid #e8e8e8', 
                backgroundColor: '#f9f9f9',
                marginBottom: '10px'
              }}>
                <h3 style={{ 
                  margin: '0 0 10px 0',
                  fontSize: '16px', 
                  fontWeight: 'bold',
                  color: '#333'
                }}>钱包信息：</h3>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                    <span style={{ fontSize: '14px', color: '#666' }}>地址：</span>
                    <span style={{ fontSize: '14px', fontWeight: 'bold', marginLeft: '5px' }}>
                      {address || "未连接"}
                    </span>
                  </div>
                  
                  <div style={{ minWidth: '200px', textAlign: 'right', paddingRight: '10px' }}>
                    <span style={{ fontSize: '14px', color: '#666' }}>余额：</span>
                    <span style={{ fontSize: '16px', fontWeight: 'bold', marginLeft: '5px' }}>
                      {loadingBalances ? "加载中..." : `${tokenBalance} ${tokenSymbol || "MTBT"}`}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Faucet信息 */}
              <div style={{ 
                padding: '15px 20px', 
                borderRadius: '8px', 
                border: '1px solid #e8e8e8', 
                backgroundColor: '#f9f9f9' 
              }}>
                <h3 style={{ 
                  margin: '0 0 10px 0',
                  fontSize: '16px', 
                  fontWeight: 'bold',
                  color: '#333'
                }}>Faucet合约信息：</h3>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                    <span style={{ fontSize: '14px', color: '#666' }}>地址：</span>
                    <span style={{ fontSize: '14px', fontWeight: 'bold', marginLeft: '5px' }}>
                      {faucetAddress || "未知"}
                    </span>
                  </div>
                  
                  <div style={{ minWidth: '200px', textAlign: 'right', paddingRight: '10px' }}>
                    <span style={{ fontSize: '14px', color: '#666' }}>余额：</span>
                    <span style={{ fontSize: '16px', fontWeight: 'bold', marginLeft: '5px', color: '#1677ff' }}>
                      {loadingBalances ? "加载中..." : `${faucetBalance} ${tokenSymbol || "MTBT"}`}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="button-group" style={{ display: 'flex', justifyContent: 'space-between', gap: '15px' }}>
              <button 
                className="primary-btn" 
                onClick={openClaimModal} 
                disabled={loading || Number(faucetBalance) <= 0 || loadingBalances || isPending}
                style={{ 
                  flex: '1', 
                  padding: '12px', 
                  backgroundColor: '#1677ff', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '4px', 
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  opacity: (loading || Number(faucetBalance) <= 0 || loadingBalances || isPending) ? '0.6' : '1'
                }}
              >
                {loading || isPending ? "处理中..." : `领取${tokenSymbol || "MTBT"}代币`}
              </button>

              <button 
                className="secondary-btn" 
                onClick={returnTokens} 
                disabled={returnLoading || Number(tokenBalance) <= 0 || loadingBalances || isPending}
                style={{ 
                  flex: '1', 
                  padding: '12px', 
                  backgroundColor: '#ffffff', 
                  color: '#1677ff', 
                  border: '1px solid #1677ff', 
                  borderRadius: '4px', 
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  opacity: (returnLoading || Number(tokenBalance) <= 0 || loadingBalances || isPending) ? '0.6' : '1'
                }}
              >
                {returnLoading || isPending ? "处理中..." : "返还代币"}
              </button>
            </div>
            
            {status.message && (
              <div className={`status-message status-${status.type}`} style={{ 
                marginTop: '15px', 
                padding: '10px', 
                borderRadius: '4px', 
                backgroundColor: status.type === 'error' ? '#fff2f0' : status.type === 'success' ? '#f6ffed' : '#e6f7ff',
                color: status.type === 'error' ? '#ff4d4f' : status.type === 'success' ? '#52c41a' : '#1677ff',
                textAlign: 'center'
              }}>
                {status.message}
              </div>
            )}
          </>
        )}
      </div>
      
      {/* 领取代币弹窗 */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '20px',
            width: '90%',
            maxWidth: '500px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
          }}>
            <h2 style={{ margin: '0 0 20px 0', fontSize: '18px' }}>添加钱包地址</h2>
            <p style={{ margin: '0 0 15px 0', color: '#666' }}>您要将测试代币发送到哪个地址？</p>
            
            <div style={{ marginBottom: '20px' }}>
              <input
                type="text"
                value={recipientAddress}
                onChange={(e) => setRecipientAddress(e.target.value)}
                placeholder={`请输入接收地址 (每次可领取 ${amountAllowedValue} ${tokenSymbol || "MTBT"})`}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '4px',
                  border: '1px solid #d9d9d9',
                  fontSize: '14px'
                }}
              />
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  padding: '8px 15px',
                  backgroundColor: 'white',
                  color: '#666',
                  border: '1px solid #d9d9d9',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                取消
              </button>
              <button
                onClick={claimTokens}
                style={{
                  padding: '8px 15px',
                  backgroundColor: '#1677ff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                确认
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Faucet;


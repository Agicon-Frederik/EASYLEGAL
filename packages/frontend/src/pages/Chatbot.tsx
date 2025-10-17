import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Grid, GridItem, Button, Input, VStack, HStack, Text, Heading, Card, Select } from '@chakra-ui/react';
import { createListCollection } from '@chakra-ui/react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

type ConversationMode = 'openai' | 'manual';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const modeOptions = createListCollection({
  items: [
    { label: 'OpenAI (AI-Powered)', value: 'openai' },
    { label: 'Manual Flow (Predefined Questions)', value: 'manual' },
  ],
});

export function Chatbot() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationComplete, setConversationComplete] = useState(false);
  const [conversationMode, setConversationMode] = useState<ConversationMode>('openai');
  const previewRef = useRef<HTMLDivElement>(null);

  // Don't start conversation on mount - wait for user to select mode and click start
  // useEffect(() => {
  //   startConversation();
  // }, []);

  // Start a new conversation
  const startConversation = async () => {
    setIsLoading(true);
    setMessages([]);
    setConversationComplete(false);
    try {
      // Get user from session (for now, we'll use user ID 1)
      // TODO: Get actual user ID from auth context
      const userId = 1;

      const response = await fetch(`${API_URL}/api/conversation/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, mode: conversationMode }),
      });

      const data = await response.json();

      if (data.success) {
        setConversationId(data.data.conversationId);
        setMessages([{
          id: data.data.messageId.toString(),
          role: 'assistant',
          content: data.data.question,
          timestamp: new Date(),
        }]);
      } else {
        console.error('Failed to start conversation:', data.message);
        alert('Failed to start conversation. Please try again.');
      }
    } catch (error) {
      console.error('Error starting conversation:', error);
      alert('Error connecting to server. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Send user message and get next question
  const handleSendMessage = async () => {
    if (!inputValue.trim() || !conversationId || isLoading || conversationComplete) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/conversation/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationId,
          message: inputValue,
        }),
      });

      const data = await response.json();

      if (data.success) {
        const assistantMessage: Message = {
          id: data.data.messageId.toString(),
          role: 'assistant',
          content: data.data.question,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);

        if (data.data.completed) {
          setConversationComplete(true);
        }
      } else {
        console.error('Failed to send message:', data.message);
        alert('Failed to send message. Please try again.');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Error connecting to server. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const generatePDF = async () => {
    if (!previewRef.current) return;

    setIsGeneratingPdf(true);

    try {
      // Capture the preview as canvas
      const canvas = await html2canvas(previewRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      // Calculate PDF dimensions
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      const pdf = new jsPDF('p', 'mm', 'a4');
      let position = 0;

      // Add first page
      pdf.addImage(
        canvas.toDataURL('image/png'),
        'PNG',
        0,
        position,
        imgWidth,
        imgHeight
      );
      heightLeft -= pageHeight;

      // Add additional pages if needed
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(
          canvas.toDataURL('image/png'),
          'PNG',
          0,
          position,
          imgWidth,
          imgHeight
        );
        heightLeft -= pageHeight;
      }

      // Save the PDF
      pdf.save(`legal-document-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Generate HTML preview from conversation
  const generateHTMLPreview = () => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: 'Times New Roman', serif;
              line-height: 1.6;
              padding: 40px;
              max-width: 800px;
              margin: 0 auto;
            }
            h1 {
              text-align: center;
              margin-bottom: 30px;
              font-size: 24px;
            }
            .conversation {
              margin-top: 30px;
            }
            .message {
              margin-bottom: 20px;
              padding: 15px;
              border-left: 3px solid #2684ff;
              background-color: #f9f9f9;
            }
            .message.user {
              border-left-color: #666;
              background-color: #f0f0f0;
            }
            .role {
              font-weight: bold;
              margin-bottom: 5px;
              color: #333;
            }
            .content {
              color: #555;
            }
            .footer {
              margin-top: 50px;
              padding-top: 20px;
              border-top: 1px solid #ccc;
              text-align: center;
              font-size: 12px;
              color: #888;
            }
          </style>
        </head>
        <body>
          <h1>Legal Document Conversation</h1>
          <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>

          <div class="conversation">
            ${messages
              .map(
                (msg) => `
              <div class="message ${msg.role}">
                <div class="role">${msg.role === 'user' ? 'You' : 'Assistant'}:</div>
                <div class="content">${msg.content}</div>
              </div>
            `
              )
              .join('')}
          </div>

          <div class="footer">
            <p>Generated by EASYLEGAL - ${new Date().getFullYear()}</p>
          </div>
        </body>
      </html>
    `;
  };

  return (
    <Box minH="100vh" bg="bg.canvas" p={4}>
      <Box maxW="95%" mx="auto">
        <VStack gap={4} align="stretch" h="calc(100vh - 32px)">
          {/* Header */}
          <VStack gap={3} align="stretch">
            <HStack justify="space-between" align="center">
              <HStack>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => navigate('/')}
                >
                  ← Back
                </Button>
                <Heading size="lg">Legal Document Chat</Heading>
              </HStack>
              <Button
                colorPalette="brand"
                onClick={generatePDF}
                loading={isGeneratingPdf}
                disabled={messages.length <= 1}
              >
                Generate PDF
              </Button>
            </HStack>

            {/* Mode Selector */}
            {!conversationId && (
              <HStack gap={3} bg="gray.50" p={4} borderRadius="md">
                <Text fontWeight="medium" minW="120px">Conversation Mode:</Text>
                <Select.Root
                  collection={modeOptions}
                  value={[conversationMode]}
                  onValueChange={(e) => setConversationMode(e.value[0] as ConversationMode)}
                  size="sm"
                  width="300px"
                  disabled={isLoading}
                >
                  <Select.Trigger>
                    <Select.ValueText placeholder="Select mode" />
                  </Select.Trigger>
                  <Select.Content>
                    {modeOptions.items.map((option) => (
                      <Select.Item key={option.value} item={option}>
                        {option.label}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Root>
                <Button
                  colorPalette="brand"
                  onClick={startConversation}
                  loading={isLoading}
                  size="sm"
                >
                  Start Conversation
                </Button>
              </HStack>
            )}
          </VStack>

          {/* Split Layout */}
          <Grid
            templateColumns={{ base: '1fr', lg: '1fr 1fr' }}
            gap={3}
            flex="1"
            h="full"
          >
          {/* Left: Chat Interface */}
          <GridItem>
            <Card.Root h="full" display="flex" flexDirection="column" bg="blue.50">
              <Card.Header bg="blue.100">
                <Heading size="md">Conversation</Heading>
              </Card.Header>
              <Card.Body flex="1" overflowY="auto" bg="blue.50">
                <VStack gap={3} align="stretch">
                  {messages.map((message) => (
                    <Box
                      key={message.id}
                      alignSelf={message.role === 'user' ? 'flex-end' : 'flex-start'}
                      maxW="80%"
                    >
                      <Card.Root
                        bg={message.role === 'user' ? 'brand.50' : 'gray.50'}
                        borderWidth="1px"
                        borderColor={message.role === 'user' ? 'brand.200' : 'gray.200'}
                      >
                        <Card.Body p={3}>
                          <Text fontSize="xs" fontWeight="bold" mb={1} color="gray.600">
                            {message.role === 'user' ? 'You' : 'Assistant'}
                          </Text>
                          <Text fontSize="sm">{message.content}</Text>
                        </Card.Body>
                      </Card.Root>
                    </Box>
                  ))}
                </VStack>
              </Card.Body>
              <Card.Footer p={4} borderTop="1px solid" borderColor="border.subtle">
                {conversationComplete ? (
                  <Box w="full" textAlign="center" py={2}>
                    <Text color="green.600" fontWeight="bold">
                      Conversation completed! You can now generate a PDF.
                    </Text>
                  </Box>
                ) : (
                  <HStack w="full">
                    <Input
                      placeholder="Type your message..."
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyPress={handleKeyPress}
                      size="lg"
                      disabled={isLoading || !conversationId}
                    />
                    <Button
                      colorPalette="brand"
                      onClick={handleSendMessage}
                      disabled={!inputValue.trim() || isLoading || !conversationId}
                      loading={isLoading}
                      size="lg"
                    >
                      Send
                    </Button>
                  </HStack>
                )}
              </Card.Footer>
            </Card.Root>
          </GridItem>

          {/* Right: HTML Preview */}
          <GridItem>
            <Card.Root h="full" display="flex" flexDirection="column" bg="green.50">
              <Card.Header bg="green.100">
                <Heading size="md">Document Preview</Heading>
              </Card.Header>
              <Card.Body flex="1" overflowY="auto" bg="white">
                <Box
                  ref={previewRef}
                  dangerouslySetInnerHTML={{ __html: generateHTMLPreview() }}
                />
              </Card.Body>
            </Card.Root>
          </GridItem>
          </Grid>
        </VStack>
      </Box>
    </Box>
  );
}

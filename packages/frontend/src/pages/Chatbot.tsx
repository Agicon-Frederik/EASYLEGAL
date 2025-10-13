import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Box, Grid, GridItem, Button, Input, VStack, HStack, Text, Heading, Card, IconButton } from '@chakra-ui/react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export function Chatbot() {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m here to help you create legal documents. What would you like to create today?',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages([...messages, newMessage]);
    setInputValue('');

    // Simulate assistant response (replace with actual API call later)
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `I understand you said: "${inputValue}". This is a demo response. In production, this would connect to your backend API.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    }, 500);
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
      <VStack gap={4} align="stretch" h="calc(100vh - 32px)">
        {/* Header */}
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

        {/* Split Layout */}
        <Grid
          templateColumns={{ base: '1fr', lg: '1fr 1fr' }}
          gap={4}
          flex="1"
          h="full"
        >
          {/* Left: Chat Interface */}
          <GridItem>
            <Card.Root h="full" display="flex" flexDirection="column">
              <Card.Header>
                <Heading size="md">Conversation</Heading>
              </Card.Header>
              <Card.Body flex="1" overflowY="auto">
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
                <HStack w="full">
                  <Input
                    placeholder="Type your message..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    size="lg"
                  />
                  <Button
                    colorPalette="brand"
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim()}
                    size="lg"
                  >
                    Send
                  </Button>
                </HStack>
              </Card.Footer>
            </Card.Root>
          </GridItem>

          {/* Right: HTML Preview */}
          <GridItem>
            <Card.Root h="full" display="flex" flexDirection="column">
              <Card.Header>
                <Heading size="md">Document Preview</Heading>
              </Card.Header>
              <Card.Body flex="1" overflowY="auto" bg="white">
                <Box
                  ref={previewRef}
                  dangerouslySetInnerHTML={{ __html: generateHTMLPreview() }}
                  sx={{
                    '& body': {
                      padding: '20px',
                    },
                  }}
                />
              </Card.Body>
            </Card.Root>
          </GridItem>
        </Grid>
      </VStack>
    </Box>
  );
}

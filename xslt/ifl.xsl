<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="2.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
	<xsl:output method="xml" encoding="UTF-8" />
	
	<xsl:template match="/">
		<fields xmlns="">
			<xsl:for-each select="/fields/field">
				<xsl:if test="(count(preceding-sibling::field[starts-with(name, '!repeat(')]) + count(preceding-sibling::field[starts-with(name, '!endRepeat(')])) mod 2 = 0">
					<xsl:apply-templates select="."/>
				</xsl:if>
			</xsl:for-each>
		</fields>
	</xsl:template>

	<xsl:template match="field[not(starts-with(name, '!'))]">
		<field>
			<xsl:copy-of select="*"/>
		</field>
	</xsl:template>

	<xsl:template match="field[starts-with(name, '!insertFile')]">
		<field>
			<xsl:choose>
				<xsl:when test="starts-with(name, '!insertFile(')">
					<xsl:variable name="file" select="substring-before(substring-after(name, '(' ), ')' )"/>
					<name><xsl:value-of select="substring-after(type, '-')"/></name>
					<type><xsl:value-of select="concat('file-', $file)"/></type>
					<xsl:copy-of select="mandatory"/>
					<xsl:copy-of select="query"/>
					<xsl:if test="substring-after($file, '.') = 'docx'">
						<file>
							<xsl:value-of select="$file"/>
						</file>
					</xsl:if>
				</xsl:when>
				<xsl:otherwise>
					<xsl:copy-of select="*"/>
				</xsl:otherwise>
			</xsl:choose>
		</field>
	</xsl:template>
	
	<xsl:template match="field[starts-with(name, '!repeat(')]">
		<xsl:variable name="subrecord" select="substring-before(substring-after(name, '!repeat('), ')')"/>
		<repeat>
			<xsl:attribute name="name" select="$subrecord"/>
			<xsl:apply-templates select="/fields/field[preceding-sibling::field[name=concat('!repeat(', $subrecord,')')] and following-sibling::field[name=concat('!endRepeat(', $subrecord, ')')]]"/>
		</repeat>	
	</xsl:template>

</xsl:stylesheet>